import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { setupRoutes } from '../server/routes-setup';
import { MemStorage } from '../server/storage';

// Create Express app
const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize storage
const storage = new MemStorage();

// Initialize with some default exchange rate
storage.upsertExchangeRate({
  fromCurrency: "usdt",
  toCurrency: "inr", 
  rate: "84.50"
});

// Setup routes
setupRoutes(app, storage, () => {
  // Broadcast function for WebSocket (simplified for serverless)
  console.log('Broadcast called in serverless environment');
});

// Export the serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Convert Vercel request to Express-compatible format
  const expressReq = req as any;
  const expressRes = res as any;

  // Handle the request with Express
  app(expressReq, expressRes);
}