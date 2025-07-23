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

  // Initiate Onmeta payment
  app.post("/api/initiate-payment", async (req, res) => {
    try {
      const { merchantTxId, upiId, inrAmount, usdtAmount, walletAddress } = req.body;
      
      // Call Onmeta API
      const onmetaResponse = await fetch(process.env.ONMETA_API_URL || "https://api.onmeta.in/v1/crypto-to-upi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.ONMETA_API_KEY || "your_onmeta_api_key"}`,
        },
        body: JSON.stringify({
          crypto: "usdt",
          chain: "polygon",
          amount: usdtAmount,
          upi_id: upiId,
          merchant_tx_id: merchantTxId,
          wallet_address: walletAddress,
          webhook_url: `${process.env.BASE_URL || "http://localhost:5000"}/api/onmeta-webhook`
        }),
      });

      if (!onmetaResponse.ok) {
        throw new Error(`Onmeta API error: ${onmetaResponse.statusText}`);
      }

      const onmetaData = await onmetaResponse.json();
      
      // Update transaction with Onmeta response
      const transaction = await storage.getTransactionByMerchantId(merchantTxId);
      if (transaction) {
        await storage.updateTransactionStatus(transaction.id, "processing", undefined, onmetaData.transaction_id);
      }

      res.json({
        success: true,
        onmeta_response: onmetaData
      });
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({ message: "Failed to initiate payment" });
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
