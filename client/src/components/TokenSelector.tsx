// Token selector component for switching between USDT and MATIC

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { Coins, Zap } from 'lucide-react';

interface TokenSelectorProps {
  className?: string;
  compact?: boolean;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  className = '',
  compact = false
}) => {
  const { selectedToken, balances, selectToken, isConnected, isCorrectNetwork } = useWallet();

  if (!isConnected || !isCorrectNetwork) {
    return null;
  }

  const tokens = [
    {
      symbol: 'USDT' as const,
      name: 'Tether USD',
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      balance: balances.USDT.balance,
    },
    {
      symbol: 'MATIC' as const,
      name: 'Polygon',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
      balance: balances.MATIC.balance,
    },
  ];

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {tokens.map((token) => {
          const Icon = token.icon;
          const isSelected = selectedToken === token.symbol;
          
          return (
            <Button
              key={token.symbol}
              onClick={() => selectToken(token.symbol)}
              size="sm"
              variant={isSelected ? "default" : "outline"}
              className={`flex items-center space-x-1 ${
                isSelected 
                  ? `${token.bgColor} ${token.color} border-2 ${token.borderColor}` 
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="text-xs font-medium">{token.symbol}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Select Token</h3>
        <div className="grid grid-cols-2 gap-3">
          {tokens.map((token) => {
            const Icon = token.icon;
            const isSelected = selectedToken === token.symbol;
            const balance = parseFloat(token.balance);
            
            return (
              <button
                key={token.symbol}
                onClick={() => selectToken(token.symbol)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? `${token.borderColor} ${token.bgColor} shadow-sm`
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isSelected ? token.bgColor : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      isSelected ? token.color : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${
                      isSelected ? token.color : 'text-gray-900'
                    }`}>
                      {token.symbol}
                    </p>
                    <p className="text-xs text-gray-500">{token.name}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-lg font-bold ${
                    isSelected ? token.color : 'text-gray-900'
                  }`}>
                    {balance.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {balance > 0 ? 'Available' : 'No balance'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};