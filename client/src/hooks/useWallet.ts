// Custom hook for wallet functionality

import { useWalletContext } from '@/contexts/WalletContext';
import type { WalletError, TokenBalance } from '@/lib/wallet/types';

export interface UseWalletReturn {
  // State
  isConnected: boolean;
  address: string | null;
  balances: {
    USDT: TokenBalance;
    MATIC: TokenBalance;
  };
  selectedToken: 'USDT' | 'MATIC';
  isLoading: boolean;
  error: string | null;
  isCorrectNetwork: boolean;
  chainId: number | null;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendToken: (to: string, amount: string, token?: 'USDT' | 'MATIC') => Promise<string>;
  selectToken: (token: 'USDT' | 'MATIC') => void;
  clearError: () => void;
  
  // Computed properties
  formattedAddress: string | null;
  currentBalance: string;
  formattedBalance: string;
  hasBalance: boolean;
  canTransact: boolean;
}

export const useWallet = (): UseWalletReturn => {
  const walletContext = useWalletContext();

  // Computed properties
  const formattedAddress = walletContext.address 
    ? `${walletContext.address.slice(0, 6)}...${walletContext.address.slice(-4)}`
    : null;

  const currentBalance = walletContext.balances[walletContext.selectedToken].balance;
  const formattedBalance = parseFloat(currentBalance).toFixed(6);
  
  const hasBalance = parseFloat(currentBalance) > 0;
  
  const canTransact = walletContext.isConnected && 
                     walletContext.isCorrectNetwork && 
                     hasBalance && 
                     !walletContext.isLoading;

  return {
    // State from context
    isConnected: walletContext.isConnected,
    address: walletContext.address,
    balances: walletContext.balances,
    selectedToken: walletContext.selectedToken,
    isLoading: walletContext.isLoading,
    error: walletContext.error,
    isCorrectNetwork: walletContext.isCorrectNetwork,
    chainId: walletContext.chainId,
    
    // Actions from context
    connectWallet: walletContext.connectWallet,
    disconnectWallet: walletContext.disconnectWallet,
    switchNetwork: walletContext.switchNetwork,
    refreshBalance: walletContext.refreshBalance,
    sendToken: walletContext.sendToken,
    selectToken: walletContext.selectToken,
    clearError: walletContext.clearError,
    
    // Computed properties
    formattedAddress,
    currentBalance,
    formattedBalance,
    hasBalance,
    canTransact,
  };
};

// Additional utility hooks for specific wallet operations

export const useWalletConnection = () => {
  const { isConnected, connectWallet, disconnectWallet, isLoading, error } = useWallet();
  
  return {
    isConnected,
    connectWallet,
    disconnectWallet,
    isLoading,
    error,
  };
};

export const useWalletBalance = () => {
  const { balances, selectedToken, currentBalance, formattedBalance, hasBalance, refreshBalance, isLoading } = useWallet();
  
  return {
    balances,
    selectedToken,
    currentBalance,
    formattedBalance,
    hasBalance,
    refreshBalance,
    isLoading,
  };
};

export const useWalletNetwork = () => {
  const { chainId, isCorrectNetwork, switchNetwork, isLoading, error } = useWallet();
  
  return {
    chainId,
    isCorrectNetwork,
    switchNetwork,
    isLoading,
    error,
  };
};

export const useWalletTransaction = () => {
  const { sendToken, canTransact, isLoading, error } = useWallet();
  
  return {
    sendToken,
    canTransact,
    isLoading,
    error,
  };
};