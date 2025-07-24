// MetaMask connection logic

import { detectMetaMask, isMetaMaskInstalled } from './detection';
import type { WalletError, WalletErrorType, MetaMaskProvider } from './types';

export class WalletConnectionError extends Error {
  constructor(
    public type: WalletErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class WalletConnection {
  private provider: MetaMaskProvider | null = null;

  constructor() {
    this.provider = detectMetaMask();
  }

  async connect(): Promise<{ address: string; chainId: number }> {
    if (!isMetaMaskInstalled()) {
      throw new WalletConnectionError(
        WalletErrorType.NOT_INSTALLED,
        'MetaMask is not installed. Please install MetaMask to continue.'
      );
    }

    this.provider = detectMetaMask();
    if (!this.provider) {
      throw new WalletConnectionError(
        WalletErrorType.NOT_INSTALLED,
        'MetaMask provider not found'
      );
    }

    try {
      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new WalletConnectionError(
          WalletErrorType.USER_REJECTED,
          'No accounts found. Please make sure MetaMask is unlocked.'
        );
      }

      // Get current chain ID
      const chainId = await this.provider.request({
        method: 'eth_chainId',
      });

      const address = accounts[0];
      const numericChainId = parseInt(chainId, 16);

      // Store connection preference
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', address);

      return {
        address,
        chainId: numericChainId,
      };
    } catch (error: any) {
      // Handle specific MetaMask errors
      if (error.code === 4001) {
        throw new WalletConnectionError(
          WalletErrorType.USER_REJECTED,
          'Connection request was rejected. Please try again and approve the connection.'
        );
      }

      if (error.code === -32002) {
        throw new WalletConnectionError(
          WalletErrorType.USER_REJECTED,
          'Connection request is already pending. Please check MetaMask.'
        );
      }

      throw new WalletConnectionError(
        WalletErrorType.NETWORK_ERROR,
        error.message || 'Failed to connect to MetaMask',
        error
      );
    }
  }

  async disconnect(): Promise<void> {
    // Clear stored connection data
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    
    // Note: MetaMask doesn't have a programmatic disconnect method
    // The user needs to disconnect manually from MetaMask
    console.log('Wallet disconnected locally. To fully disconnect, please disconnect from MetaMask.');
  }

  async getAccounts(): Promise<string[]> {
    if (!this.provider) {
      throw new WalletConnectionError(
        WalletErrorType.NOT_INSTALLED,
        'MetaMask not available'
      );
    }

    try {
      const accounts = await this.provider.request({
        method: 'eth_accounts',
      });
      return accounts || [];
    } catch (error: any) {
      throw new WalletConnectionError(
        WalletErrorType.NETWORK_ERROR,
        'Failed to get accounts',
        error
      );
    }
  }

  async getCurrentChainId(): Promise<number> {
    if (!this.provider) {
      throw new WalletConnectionError(
        WalletErrorType.NOT_INSTALLED,
        'MetaMask not available'
      );
    }

    try {
      const chainId = await this.provider.request({
        method: 'eth_chainId',
      });
      return parseInt(chainId, 16);
    } catch (error: any) {
      throw new WalletConnectionError(
        WalletErrorType.NETWORK_ERROR,
        'Failed to get chain ID',
        error
      );
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const accounts = await this.getAccounts();
      return accounts.length > 0;
    } catch {
      return false;
    }
  }

  async autoReconnect(): Promise<{ address: string; chainId: number } | null> {
    const wasConnected = localStorage.getItem('wallet_connected') === 'true';
    const storedAddress = localStorage.getItem('wallet_address');

    if (!wasConnected || !storedAddress) {
      return null;
    }

    try {
      const isCurrentlyConnected = await this.isConnected();
      if (!isCurrentlyConnected) {
        // Clear stale connection data
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_address');
        return null;
      }

      const accounts = await this.getAccounts();
      const chainId = await this.getCurrentChainId();

      if (accounts.length > 0) {
        return {
          address: accounts[0],
          chainId,
        };
      }

      return null;
    } catch (error) {
      console.error('Auto-reconnect failed:', error);
      // Clear stale connection data
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');
      return null;
    }
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (this.provider) {
      this.provider.on('accountsChanged', callback);
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (this.provider) {
      this.provider.on('chainChanged', callback);
    }
  }

  removeAllListeners(): void {
    if (this.provider) {
      this.provider.removeListener('accountsChanged', () => {});
      this.provider.removeListener('chainChanged', () => {});
    }
  }
}

// Create singleton instance
export const walletConnection = new WalletConnection();