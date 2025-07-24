// Balance caching utility with TTL

interface CacheEntry {
  balance: string;
  timestamp: number;
  address: string;
}

export class BalanceCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 30 * 1000; // 30 seconds

  private getCacheKey(address: string, chainId: number): string {
    return `${address}_${chainId}`;
  }

  get(address: string, chainId: number): string | null {
    const key = this.getCacheKey(address, chainId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.balance;
  }

  set(address: string, chainId: number, balance: string): void {
    const key = this.getCacheKey(address, chainId);
    this.cache.set(key, {
      balance,
      timestamp: Date.now(),
      address,
    });
  }

  clear(address?: string, chainId?: number): void {
    if (address && chainId) {
      const key = this.getCacheKey(address, chainId);
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Create singleton instance
export const balanceCache = new BalanceCache();

// Clean up expired entries every minute
setInterval(() => {
  balanceCache.clearExpired();
}, 60 * 1000);