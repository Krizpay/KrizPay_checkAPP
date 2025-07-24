// Network detection and switching utilities

import { detectMetaMask } from './detection';
import { WALLET_CONFIG } from './types';
import type { WalletError, WalletErrorType, MetaMaskProvider } from './types';

export class NetworkError extends Error {
  constructor(
    public type: WalletErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NetworkManager {
  private provider: MetaMaskProvider | null = null;

  constructor() {
    this.provider = detectMetaMask();
  }

  async getCurrentChainId(): Promise<number> {
    if (!this.provider) {
      throw new NetworkError(
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
      throw new NetworkError(
        WalletErrorType.NETWORK_ERROR,
        'Failed to get current network',
        error
      );
    }
  }

  async isPolygonNetwork(): Promise<boolean> {
    try {
      const chainId = await this.getCurrentChainId();
      return chainId === WALLET_CONFIG.POLYGON_CHAIN_ID;
    } catch {
      return false;
    }
  }

  async switchToPolygon(): Promise<void> {
    if (!this.provider) {
      throw new NetworkError(
        WalletErrorType.NOT_INSTALLED,
        'MetaMask not available'
      );
    }

    const polygonChainId = `0x${WALLET_CONFIG.POLYGON_CHAIN_ID.toString(16)}`;

    try {
      // Try to switch to Polygon network
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: polygonChainId }],
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await this.addPolygonNetwork();
        } catch (addError: any) {
          throw new NetworkError(
            WalletErrorType.NETWORK_ERROR,
            'Failed to add Polygon network',
            addError
          );
        }
      } else if (switchError.code === 4001) {
        throw new NetworkError(
          WalletErrorType.USER_REJECTED,
          'Network switch was rejected by user'
        );
      } else {
        throw new NetworkError(
          WalletErrorType.NETWORK_ERROR,
          'Failed to switch to Polygon network',
          switchError
        );
      }
    }
  }

  async addPolygonNetwork(): Promise<void> {
    if (!this.provider) {
      throw new NetworkError(
        WalletErrorType.NOT_INSTALLED,
        'MetaMask not available'
      );
    }

    const polygonNetwork = {
      chainId: `0x${WALLET_CONFIG.POLYGON_CHAIN_ID.toString(16)}`,
      chainName: 'Polygon Mainnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: [
        'https://polygon-rpc.com',
        'https://rpc-mainnet.matic.network',
        'https://matic-mainnet.chainstacklabs.com',
      ],
      blockExplorerUrls: ['https://polygonscan.com/'],
    };

    try {
      await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [polygonNetwork],
      });
    } catch (error: any) {
      if (error.code === 4001) {
        throw new NetworkError(
          WalletErrorType.USER_REJECTED,
          'Adding Polygon network was rejected by user'
        );
      } else {
        throw new NetworkError(
          WalletErrorType.NETWORK_ERROR,
          'Failed to add Polygon network',
          error
        );
      }
    }
  }

  async ensurePolygonNetwork(): Promise<void> {
    const isPolygon = await this.isPolygonNetwork();
    if (!isPolygon) {
      await this.switchToPolygon();
    }
  }

  getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Polygon Mumbai Testnet';
      case 56:
        return 'BSC Mainnet';
      case 43114:
        return 'Avalanche Mainnet';
      default:
        return `Unknown Network (${chainId})`;
    }
  }

  isTestNetwork(chainId: number): boolean {
    const testNetworks = [3, 4, 5, 42, 80001, 97]; // Ropsten, Rinkeby, Goerli, Kovan, Mumbai, BSC Testnet
    return testNetworks.includes(chainId);
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (this.provider) {
      this.provider.on('chainChanged', callback);
    }
  }

  removeChainChangedListener(callback: (chainId: string) => void): void {
    if (this.provider) {
      this.provider.removeListener('chainChanged', callback);
    }
  }
}

// Create singleton instance
export const networkManager = new NetworkManager();