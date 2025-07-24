// Wallet Context for MetaMask integration

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { WalletState, WalletError, WalletErrorType, TokenBalance } from '@/lib/wallet/types';

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  refreshBalance: (forceRefresh?: boolean) => Promise<void>;
  sendToken: (to: string, amount: string, token?: 'USDT' | 'MATIC') => Promise<string>;
  selectToken: (token: 'USDT' | 'MATIC') => void;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Wallet actions
type WalletAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { address: string; chainId: number } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_TOKEN_BALANCE'; payload: { token: 'USDT' | 'MATIC'; balance: string } }
  | { type: 'SET_CHAIN_ID'; payload: number }
  | { type: 'SET_ERROR'; payload: WalletError | string | null }
  | { type: 'SET_SELECTED_TOKEN'; payload: 'USDT' | 'MATIC' }
  | { type: 'CLEAR_ERROR' };

// Initial wallet state
const initialState: WalletState = {
  isConnected: false,
  address: null,
  balances: {
    USDT: {
      symbol: 'USDT',
      balance: '0',
      decimals: 6,
      contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      isNative: false,
    },
    MATIC: {
      symbol: 'MATIC',
      balance: '0',
      decimals: 18,
      isNative: true,
    },
  },
  selectedToken: 'USDT',
  isLoading: false,
  error: null,
  chainId: null,
  isCorrectNetwork: false,
};

// Wallet reducer
const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        address: action.payload.address,
        chainId: action.payload.chainId,
        isCorrectNetwork: action.payload.chainId === 137, // Polygon
        error: null,
        isLoading: false,
      };
    
    case 'SET_DISCONNECTED':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'SET_TOKEN_BALANCE':
      return {
        ...state,
        balances: {
          ...state.balances,
          [action.payload.token]: {
            ...state.balances[action.payload.token],
            balance: action.payload.balance,
          },
        },
      };
    
    case 'SET_CHAIN_ID':
      return {
        ...state,
        chainId: action.payload,
        isCorrectNetwork: action.payload === 137, // Polygon
      };
    
    case 'SET_SELECTED_TOKEN':
      return { ...state, selectedToken: action.payload };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: typeof action.payload === 'string' ? action.payload : action.payload?.message || 'Unknown error',
        isLoading: false,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  const connectWallet = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { walletConnection } = await import('@/lib/wallet/connection');
      const result = await walletConnection.connect();
      
      dispatch({
        type: 'SET_CONNECTED',
        payload: {
          address: result.address,
          chainId: result.chainId,
        },
      });

      // Refresh balance after connection
      if (result.chainId === 137) {
        await refreshBalance();
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to connect wallet' });
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    try {
      const { walletConnection } = await import('@/lib/wallet/connection');
      await walletConnection.disconnect();
      dispatch({ type: 'SET_DISCONNECTED' });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Still disconnect locally even if there's an error
      dispatch({ type: 'SET_DISCONNECTED' });
    }
  };

  const switchNetwork = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { networkManager } = await import('@/lib/wallet/network');
      await networkManager.switchToPolygon();
      
      // Get updated chain ID after switch
      const chainId = await networkManager.getCurrentChainId();
      dispatch({ type: 'SET_CHAIN_ID', payload: chainId });
      
      // Refresh balance after network switch
      if (chainId === 137) {
        await refreshBalance();
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to switch network' });
    }
  };

  const refreshBalance = async (forceRefresh = false): Promise<void> => {
    if (!state.address || state.chainId !== 137) return;
    
    try {
      // Fetch both USDT and MATIC balances
      const [{ usdtContract }, { maticContract }] = await Promise.all([
        import('@/lib/wallet/contract'),
        import('@/lib/wallet/matic-contract')
      ]);

      const [usdtBalance, maticBalance] = await Promise.all([
        usdtContract.getUSDTBalance(state.address),
        maticContract.getMATICBalance(state.address)
      ]);
      
      // Update both balances
      dispatch({ type: 'SET_TOKEN_BALANCE', payload: { token: 'USDT', balance: usdtBalance } });
      dispatch({ type: 'SET_TOKEN_BALANCE', payload: { token: 'MATIC', balance: maticBalance } });
    } catch (error: any) {
      console.error('Failed to refresh balance:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch balance' });
    }
  };

  const sendToken = async (to: string, amount: string, token?: 'USDT' | 'MATIC'): Promise<string> => {
    const selectedToken = token || state.selectedToken;
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (!state.address || !state.isConnected) {
        throw new Error('Wallet not connected');
      }

      if (state.chainId !== 137) {
        throw new Error('Please switch to Polygon network');
      }

      let txHash: string;

      if (selectedToken === 'USDT') {
        const { usdtContract } = await import('@/lib/wallet/contract');
        txHash = await usdtContract.transferUSDT(to, amount);
      } else {
        const { maticContract } = await import('@/lib/wallet/matic-contract');
        txHash = await maticContract.transferMATIC(to, amount);
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Refresh balances after successful transaction
      setTimeout(() => refreshBalance(true), 2000);
      
      return txHash;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || `${selectedToken} transfer failed` });
      throw error;
    }
  };

  const selectToken = (token: 'USDT' | 'MATIC'): void => {
    dispatch({ type: 'SET_SELECTED_TOKEN', payload: token });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Auto-reconnect on app startup
  useEffect(() => {
    const autoReconnect = async () => {
      try {
        const { walletConnection } = await import('@/lib/wallet/connection');
        const result = await walletConnection.autoReconnect();
        
        if (result) {
          dispatch({
            type: 'SET_CONNECTED',
            payload: {
              address: result.address,
              chainId: result.chainId,
            },
          });

          // Refresh balance after auto-reconnection
          if (result.chainId === 137) {
            await refreshBalance();
          }
        }
      } catch (error) {
        console.error('Auto-reconnect failed:', error);
        // Clear any stale connection data
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_address');
      }
    };

    autoReconnect();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== state.address) {
          dispatch({
            type: 'SET_CONNECTED',
            payload: { address: accounts[0], chainId: state.chainId || 137 }
          });
        }
      };

      const handleChainChanged = async (chainId: string) => {
        const numericChainId = parseInt(chainId, 16);
        dispatch({ type: 'SET_CHAIN_ID', payload: numericChainId });
        
        // Clear balances when switching networks
        dispatch({ type: 'SET_TOKEN_BALANCE', payload: { token: 'USDT', balance: '0' } });
        dispatch({ type: 'SET_TOKEN_BALANCE', payload: { token: 'MATIC', balance: '0' } });
        
        // Refresh balance if on Polygon network
        if (numericChainId === 137 && state.address) {
          try {
            await refreshBalance();
          } catch (error) {
            console.error('Failed to refresh balance after network change:', error);
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [state.address, state.chainId]);

  const contextValue: WalletContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance,
    sendToken,
    selectToken,
    clearError,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};