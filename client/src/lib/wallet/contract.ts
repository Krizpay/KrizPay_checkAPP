// USDT contract interaction utilities

import { ethers } from 'ethers';
import { detectMetaMask } from './detection';
import { WALLET_CONFIG } from './types';
import type { WalletError, WalletErrorType } from './types';

// USDT contract ABI (minimal required functions)
const USDT_ABI = [
  // balanceOf
  'function balanceOf(address owner) view returns (uint256)',
  // transfer
  'function transfer(address to, uint256 amount) returns (bool)',
  // decimals
  'function decimals() view returns (uint8)',
  // symbol
  'function symbol() view returns (string)',
  // allowance
  'function allowance(address owner, address spender) view returns (uint256)',
  // approve
  'function approve(address spender, uint256 amount) returns (bool)',
];

export class ContractError extends Error {
  constructor(
    public type: WalletErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ContractError';
  }
}

export class USDTContract {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    const ethereum = detectMetaMask();
    if (ethereum) {
      this.provider = new ethers.BrowserProvider(ethereum);
    }
  }

  private async ensureProvider(): Promise<ethers.BrowserProvider> {
    if (!this.provider) {
      await this.initializeProvider();
    }
    
    if (!this.provider) {
      throw new ContractError(
        WalletErrorType.NOT_INSTALLED,
        'MetaMask provider not available'
      );
    }
    
    return this.provider;
  }

  private async getContract(needsSigner = false): Promise<ethers.Contract> {
    const provider = await this.ensureProvider();
    
    if (needsSigner) {
      this.signer = await provider.getSigner();
      this.contract = new ethers.Contract(
        WALLET_CONFIG.USDT_CONTRACT_ADDRESS,
        USDT_ABI,
        this.signer
      );
    } else {
      this.contract = new ethers.Contract(
        WALLET_CONFIG.USDT_CONTRACT_ADDRESS,
        USDT_ABI,
        provider
      );
    }
    
    return this.contract;
  }

  async getUSDTBalance(address: string): Promise<string> {
    try {
      const contract = await this.getContract(false);
      const balance = await contract.balanceOf(address);
      
      // Convert from wei to USDT (6 decimals)
      const formattedBalance = ethers.formatUnits(balance, WALLET_CONFIG.USDT_DECIMALS);
      return formattedBalance;
    } catch (error: any) {
      console.error('Error fetching USDT balance:', error);
      
      if (error.code === 'NETWORK_ERROR') {
        throw new ContractError(
          WalletErrorType.NETWORK_ERROR,
          'Network error while fetching balance. Please check your connection.',
          error
        );
      }
      
      throw new ContractError(
        WalletErrorType.NETWORK_ERROR,
        'Failed to fetch USDT balance',
        error
      );
    }
  }

  async transferUSDT(to: string, amount: string): Promise<string> {
    try {
      const contract = await this.getContract(true);
      
      // Convert amount to wei (6 decimals for USDT)
      const amountInWei = ethers.parseUnits(amount, WALLET_CONFIG.USDT_DECIMALS);
      
      // Execute transfer
      const transaction = await contract.transfer(to, amountInWei);
      
      return transaction.hash;
    } catch (error: any) {
      console.error('Error transferring USDT:', error);
      
      if (error.code === 4001) {
        throw new ContractError(
          WalletErrorType.USER_REJECTED,
          'Transaction was rejected by user',
          error
        );
      }
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new ContractError(
          WalletErrorType.INSUFFICIENT_BALANCE,
          'Insufficient USDT balance for this transaction',
          error
        );
      }
      
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new ContractError(
          WalletErrorType.INSUFFICIENT_GAS,
          'Unable to estimate gas. You may have insufficient ETH for gas fees.',
          error
        );
      }
      
      throw new ContractError(
        WalletErrorType.TRANSACTION_FAILED,
        'USDT transfer failed',
        error
      );
    }
  }

  async estimateTransferGas(to: string, amount: string): Promise<string> {
    try {
      const contract = await this.getContract(true);
      const amountInWei = ethers.parseUnits(amount, WALLET_CONFIG.USDT_DECIMALS);
      
      const gasEstimate = await contract.transfer.estimateGas(to, amountInWei);
      return gasEstimate.toString();
    } catch (error: any) {
      console.error('Error estimating gas:', error);
      
      throw new ContractError(
        WalletErrorType.NETWORK_ERROR,
        'Failed to estimate gas for transaction',
        error
      );
    }
  }

  async getTokenInfo(): Promise<{ symbol: string; decimals: number }> {
    try {
      const contract = await this.getContract(false);
      
      const [symbol, decimals] = await Promise.all([
        contract.symbol(),
        contract.decimals(),
      ]);
      
      return {
        symbol,
        decimals: Number(decimals),
      };
    } catch (error: any) {
      console.error('Error fetching token info:', error);
      
      throw new ContractError(
        WalletErrorType.NETWORK_ERROR,
        'Failed to fetch token information',
        error
      );
    }
  }

  async waitForTransaction(txHash: string): Promise<ethers.TransactionReceipt> {
    try {
      const provider = await this.ensureProvider();
      const receipt = await provider.waitForTransaction(txHash);
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }
      
      return receipt;
    } catch (error: any) {
      console.error('Error waiting for transaction:', error);
      
      throw new ContractError(
        WalletErrorType.TRANSACTION_FAILED,
        'Transaction confirmation failed',
        error
      );
    }
  }

  async getCurrentGasPrice(): Promise<string> {
    try {
      const provider = await this.ensureProvider();
      const feeData = await provider.getFeeData();
      
      if (feeData.gasPrice) {
        return ethers.formatUnits(feeData.gasPrice, 'gwei');
      }
      
      return '0';
    } catch (error: any) {
      console.error('Error fetching gas price:', error);
      return '0';
    }
  }
}

// Create singleton instance
export const usdtContract = new USDTContract();