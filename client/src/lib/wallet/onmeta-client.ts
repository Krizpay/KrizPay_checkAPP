// Onmeta API client with error handling and retry logic

import type { 
  OnmetaOfframpOrder, 
  OnmetaOrderResponse, 
  OnmetaQuoteRequest, 
  OnmetaQuoteResponse,
  WalletError,
  WalletErrorType 
} from './types';

export class OnmetaApiClient {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'x-api-key': this.apiKey,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let lastError: Error;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw this.createWalletError(lastError);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createWalletError(error: Error): WalletError {
    const message = error.message.toLowerCase();
    
    if (message.includes('insufficient liquidity')) {
      return {
        type: WalletErrorType.INSUFFICIENT_LIQUIDITY,
        message: 'Insufficient liquidity for this transaction amount',
        details: error
      };
    }
    
    if (message.includes('expired') || message.includes('timeout')) {
      return {
        type: WalletErrorType.ORDER_EXPIRED,
        message: 'Order has expired. Please create a new payment.',
        details: error
      };
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return {
        type: WalletErrorType.NETWORK_ERROR,
        message: 'Network error. Please check your connection and try again.',
        details: error
      };
    }

    return {
      type: WalletErrorType.ORDER_FAILED,
      message: 'Payment order failed. Please try again.',
      details: error
    };
  }

  async getQuote(request: OnmetaQuoteRequest): Promise<OnmetaQuoteResponse> {
    const queryParams = new URLSearchParams({
      sellTokenSymbol: request.sellTokenSymbol,
      chainId: request.chainId.toString(),
      fiatCurrency: request.fiatCurrency,
      fiatAmount: request.fiatAmount.toString()
    });

    return this.makeRequest<OnmetaQuoteResponse>(
      `/quote?${queryParams.toString()}`
    );
  }

  async createOfframpOrder(order: OnmetaOfframpOrder): Promise<OnmetaOrderResponse> {
    return this.makeRequest<OnmetaOrderResponse>('/offramp/orders/create', {
      method: 'POST',
      body: JSON.stringify(order),
      headers: {
        'X-Forwarded-For': '127.0.0.1', // Required for instant payout
      }
    });
  }

  async getOrderStatus(orderId: string): Promise<any> {
    return this.makeRequest(`/transactions/${orderId}`);
  }

  async submitTransactionHash(orderId: string, txHash: string): Promise<any> {
    return this.makeRequest(`/offramp/orders/${orderId}/transaction`, {
      method: 'POST',
      body: JSON.stringify({ txHash })
    });
  }
}

// Create singleton instance
const createOnmetaClient = () => {
  const baseUrl = import.meta.env.VITE_ONMETA_API_URL || 'https://stg.api.onmeta.in/v1';
  const apiKey = import.meta.env.VITE_ONMETA_API_KEY || '';
  
  if (!apiKey) {
    console.warn('Onmeta API key not configured');
  }
  
  return new OnmetaApiClient(baseUrl, apiKey);
};

export const onmetaClient = createOnmetaClient();