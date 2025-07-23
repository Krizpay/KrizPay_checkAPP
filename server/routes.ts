import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

const clients = new Set<WebSocket>();

function broadcastToClients(message: any) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current exchange rate
  app.get("/api/exchange-rate/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await storage.getExchangeRate(from, to);
      
      if (!rate) {
        return res.status(404).json({ message: "Exchange rate not found" });
      }
      
      res.json(rate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exchange rate" });
    }
  });

  // Create transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      // Broadcast transaction creation to connected clients
      broadcastToClients({
        type: "transaction_created",
        transaction
      });
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Get transaction by ID
  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  // Get recent transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Onmeta webhook endpoint
  app.post("/api/onmeta-webhook", async (req, res) => {
    try {
      const { merchant_tx_id, status, upi_id, amount, tx_hash, onmeta_tx_id } = req.body;
      
      const transaction = await storage.getTransactionByMerchantId(merchant_tx_id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      const updatedTransaction = await storage.updateTransactionStatus(
        transaction.id,
        status.toLowerCase(),
        tx_hash,
        onmeta_tx_id
      );

      // Broadcast status update to connected clients
      broadcastToClients({
        type: "transaction_updated",
        transaction: updatedTransaction
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Initiate Onmeta payment (Offramp - crypto to fiat)
  app.post("/api/initiate-payment", async (req, res) => {
    try {
      const { merchantTxId, upiId, inrAmount, usdtAmount, walletAddress } = req.body;
      
      // Create Onmeta offramp order using their API (staging)
      const onmetaResponse = await fetch("https://stg.api.onmeta.in/v1/offramp/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ONMETA_API_KEY,
          "Authorization": `Bearer ${process.env.ONMETA_API_KEY}`,
          "X-Forwarded-For": "127.0.0.1", // Required for instant payout
        },
        body: JSON.stringify({
          sellTokenSymbol: "USDT",
          sellTokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
          chainId: 137, // Polygon mainnet
          fiatCurrency: "inr",
          fiatAmount: parseFloat(inrAmount),
          senderWalletAddress: walletAddress,
          refundWalletAddress: walletAddress,
          bankDetails: {
            accountNumber: "temp", // This should be linked UPI for instant payout
            ifsc: "temp"
          },
          metaData: {
            merchantTxId: merchantTxId,
            upiId: upiId,
            webhook_url: `${process.env.BASE_URL || "http://localhost:5000"}/api/onmeta-webhook`
          }
        }),
      });

      if (!onmetaResponse.ok) {
        const errorText = await onmetaResponse.text();
        console.error("Onmeta API error:", errorText);
        throw new Error(`Onmeta API error: ${onmetaResponse.status} - ${errorText}`);
      }

      const onmetaData = await onmetaResponse.json();
      
      // Update transaction with Onmeta response
      const transaction = await storage.getTransactionByMerchantId(merchantTxId);
      if (transaction) {
        await storage.updateTransactionStatus(transaction.id, "processing", undefined, onmetaData.data?.orderId);
      }

      // Broadcast payment initiation to connected clients
      broadcastToClients({
        type: "payment_initiated",
        transaction_id: merchantTxId,
        onmeta_data: onmetaData
      });

      res.json({
        success: true,
        onmeta_response: onmetaData,
        order_id: onmetaData.data?.orderId,
        receiver_address: onmetaData.data?.receiverWalletAddress,
        gas_estimate: onmetaData.data?.gasUseEstimate,
        quote: onmetaData.data?.quote
      });
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      res.status(500).json({ 
        message: "Failed to initiate payment", 
        error: error?.message || "Unknown error occurred" 
      });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return httpServer;
}
