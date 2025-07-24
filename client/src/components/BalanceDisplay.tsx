// Balance display component for USDT and MATIC balances

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { Loader2, RefreshCw, AlertCircle, Coins, Zap } from 'lucide-react';
import { TokenSelector } from './TokenSelector';

interface BalanceDisplayProps {
  className?: string;
  showRefreshButton?: boolean;
  compact?: boolean;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  className = '',
  showRefreshButton = true,
  compact = false
}) => {
  const {
    isConnected,
    selectedToken,
    balances,
    formattedBalance,
    hasBalance,
    isLoading,
    error,
    isCorrectNetwork,
    refreshBalance,
    clearError
  } = useWallet();

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance(true); // Force refresh
    } catch (error) {
      console.error('Balance refresh failed:', error);
    }
  };

  // Don't show if not connected or not on correct network
  if (!isConnected || !isCorrectNetwork) {
    return null;
  }

  const getTokenIcon = (token: 'USDT' | 'MATIC') => {
    return token === 'USDT' ? Coins : Zap;
  };

  const getTokenColor = (token: 'USDT' | 'MATIC') => {
    return token === 'USDT' ? 'text-yellow-600' : 'text-purple-600';
  };

  const getTokenBgColor = (token: 'USDT' | 'MATIC') => {
    return token === 'USDT' ? 'bg-yellow-100' : 'bg-purple-100';
  };

  // Compact version
  if (compact) {
    const TokenIcon = getTokenIcon(selectedToken);
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <TokenIcon className={`w-4 h-4 ${getTokenColor(selectedToken)}`} />
          <span className="text-sm font-medium text-gray-700">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `${formattedBalance} ${selectedToken}`
            )}
          </span>
        </div>
        {showRefreshButton && (
          <Button
            onClick={handleRefreshBalance}
            size="sm"
            variant="ghost"
            disabled={isLoading}
            className="p-1 h-6 w-6"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  const TokenIcon = getTokenIcon(selectedToken);
  const tokenColor = getTokenColor(selectedToken);
  const tokenBgColor = getTokenBgColor(selectedToken);

  // Full card version
  return (
    <div className={className}>
      {/* Token Selector */}
      <TokenSelector compact className="mb-4" />
      
      <Card>
        <CardContent className="p-4">
          {/* Error Display */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 flex-1">{error}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearError}
                className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
              >
                ×
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${tokenBgColor} rounded-full flex items-center justify-center`}>
                <TokenIcon className={`w-5 h-5 ${tokenColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{selectedToken} Balance</p>
                <div className="flex items-center space-x-2">
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">{formattedBalance}</p>
                  )}
                  <span className="text-sm text-gray-500">{selectedToken}</span>
                </div>
              </div>
            </div>

            {showRefreshButton && (
              <Button
                onClick={handleRefreshBalance}
                size="sm"
                variant="outline"
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            )}
          </div>

          {/* Balance Status */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            {hasBalance ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Ready for payments</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-orange-600">
                  Add {selectedToken} to your wallet to make payments
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};