// Wallet and MetaMask integration types

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
  isNative?: boolean;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balances: {
    USDT: TokenBalance;
    MATIC: TokenBalance;
  };
  selectedToken: 'USDT' | 'MATIC';
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
}

export interface WalletConfig {
  POLYGON_CHAIN_ID: number;
  POLYGON_RPC_URL: string;
  USDT_CONTRACT_ADDRESS: string;
  USDT_DECIMALS: number;
  ONMETA_API_BASE: string;
  ONMETA_STAGING_API: string;
}

export const WALLET_CONFIG: WalletConfig = {
  POLYGON_CHAIN_ID: 137,
  POLYGON_RPC_URL: 'https://polygon-rpc.com',
  USDT_CONTRACT_ADDRESS: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  USDT_DECIMALS: 6,
  ONMETA_API_BASE: 'https://api.onmeta.in/v1',
  ONMETA_STAGING_API: 'https://stg.api.onmeta.in/v1'
};

export enum WalletErrorType {
  NOT_INSTALLED = 'NOT_INSTALLED',
  USER_REJECTED = 'USER_REJECTED',
  WRONG_NETWORK = 'WRONG_NETWORK',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ORDER_FAILED = 'ORDER_FAILED',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  ORDER_EXPIRED = 'ORDER_EXPIRED',
  WEBHOOK_TIMEOUT = 'WEBHOOK_TIMEOUT'
}

export interface WalletError {
  type: WalletErrorType;
  message: string;
  details?: any;
}

export interface WalletTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  gasUsed: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

// Onmeta API Data Models
export interface OnmetaOfframpOrder {
  sellTokenSymbol: string;
  sellTokenAddress: string;
  chainId: number;
  fiatCurrency: string;
  fiatAmount: number;
  senderWalletAddress: string;
  refundWalletAddress: string;
  bankDetails: {
    accountNumber: string;
    ifsc: string;
  };
  metaData: {
    merchantTxId: string;
    upiId: string;
    webhook_url: string;
  };
}

export interface OnmetaOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    receiverWalletAddress: string;
    gasUseEstimate: string;
    quote: {
      exchangeRate: number;
      fees: number;
      totalAmount: number;
    };
    expiryTime: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  };
  message?: string;
}

export interface OnmetaWebhookPayload {
  orderId: string;
  merchantTxId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING';
  upiId: string;
  fiatAmount: number;
  cryptoAmount: number;
  txHash?: string;
  timestamp: string;
  failureReason?: string;
}

export interface OnmetaQuoteRequest {
  sellTokenSymbol: string;
  chainId: number;
  fiatCurrency: string;
  fiatAmount: number;
}

export interface OnmetaQuoteResponse {
  success: boolean;
  data: {
    exchangeRate: number;
    cryptoAmount: number;
    fees: {
      platformFee: number;
      networkFee: number;
      totalFee: number;
    };
    estimatedGas: string;
    validUntil: string;
  };
}

// MetaMask detection
export interface MetaMaskProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}