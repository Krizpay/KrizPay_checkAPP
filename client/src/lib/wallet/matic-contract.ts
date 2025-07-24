// MATIC (native Polygon token) contract interaction utilities

import { ethers } from 'ethers';
import { detectMetaMask } from './detection';
import { WALLET_CONFIG } from './types';
import type { WalletError, WalletErrorType } from './types';

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

export class MATICContract {
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

  async getMATICBalance(address: string): Promise<string> {
    try {
      const provider = await this.ensureProvider();
      const balance = await provider.getBalance(address);
      
      // Convert from wei to MATIC (18 decimals)
      const formattedBalance = ethers.formatEther(balance);
      return formattedBalance;
    } catch (error: any) {
      console.error('Error fetching MATIC balance:', error);
      
      if (error.code === 'NETWORK_ERROR') {
        throw new ContractError(
          WalletErrorType.NETWORK_ERROR,
          'Network error while fetching balance. Please check your connection.',
          error
        );
      }
      
      throw new ContractError(
        WalletErrorType.NETWORK_ERROR,
        'Failed to fetch MATIC balance',
        error
      );
    }
  }

  async transferMATIC(to: string, amount: string): Promise<string> {
    try {
      const provider = await this.ensureProvider();
      this.signer = await provider.getSigner();
      
      // Convert amount to wei (18 decimals for MATIC)
      const amountInWei = ethers.parseEther(amount);
      
      // Create transaction
      const transaction = {
        to: to,
        value: amountInWei,
      };
      
      // Execute transfer
      const txResponse = await this.signer.sendTransaction(transaction);
      
      return txResponse.hash;
    } catch (error: any) {
      console.error('Error transferring MATIC:', error);
      
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
          'Insufficient MATIC balance for this transaction',
          error
        );
      }
      
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new ContractError(
          WalletErrorType.INSUFFICIENT_GAS,
          'Unable to estimate gas. You may have insufficient MATIC for gas fees.',
          error
        );
      }
      
      throw new ContractError(
        WalletErrorType.TRANSACTION_FAILED,
        'MATIC transfer failed',
        error
      );
    }
  }

  async estimateTransferGas(to: string, amount: string): Promise<string> {
    try {
      const provider = await this.ensureProvider();
      const amountInWei = ethers.parseEther(amount);
      
      const gasEstimate = await provider.estimateGas({
        to: to,
        value: amountInWei,
      });
      
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
export const maticContract = new MATICContract();