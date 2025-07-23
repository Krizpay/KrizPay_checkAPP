import { users, transactions, exchangeRates, type User, type InsertUser, type Transaction, type InsertTransaction, type ExchangeRate, type InsertExchangeRate } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionByMerchantId(merchantTxId: string): Promise<Transaction | undefined>;
  updateTransactionStatus(id: number, status: string, txHash?: string, onmetaTxId?: string): Promise<Transaction | undefined>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  
  getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined>;
  upsertExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private exchangeRates: Map<string, ExchangeRate>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentRateId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.exchangeRates = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentRateId = 1;
    
    // Initialize with default exchange rate
    this.upsertExchangeRate({
      fromCurrency: "usdt",
      toCurrency: "inr",
      rate: "84.50"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByMerchantId(merchantTxId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (transaction) => transaction.merchantTxId === merchantTxId,
    );
  }

  async updateTransactionStatus(id: number, status: string, txHash?: string, onmetaTxId?: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction: Transaction = {
      ...transaction,
      status,
      txHash: txHash || transaction.txHash,
      onmetaTxId: onmetaTxId || transaction.onmetaTxId,
      updatedAt: new Date(),
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    const allTransactions = Array.from(this.transactions.values());
    return allTransactions
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined> {
    const key = `${fromCurrency}_${toCurrency}`;
    return this.exchangeRates.get(key);
  }

  async upsertExchangeRate(insertRate: InsertExchangeRate): Promise<ExchangeRate> {
    const key = `${insertRate.fromCurrency}_${insertRate.toCurrency}`;
    const existing = this.exchangeRates.get(key);
    
    if (existing) {
      const updated: ExchangeRate = {
        ...existing,
        rate: insertRate.rate,
        updatedAt: new Date(),
      };
      this.exchangeRates.set(key, updated);
      return updated;
    } else {
      const id = this.currentRateId++;
      const rate: ExchangeRate = {
        ...insertRate,
        id,
        updatedAt: new Date(),
      };
      this.exchangeRates.set(key, rate);
      return rate;
    }
  }
}

export const storage = new MemStorage();
