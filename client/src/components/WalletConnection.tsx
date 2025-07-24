// WalletConnection component for MetaMask integration

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { isMetaMaskInstalled, getMetaMaskInstallUrl, isMobileDevice } from '@/lib/wallet/detection';
import { Wallet, ExternalLink, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface WalletConnectionProps {
  className?: string;
  showBalance?: boolean;
  compact?: boolean;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ 
  className = '', 
  showBalance = true,
  compact = false 
}) => {
  const { 
    isConnected, 
    address, 
    formattedAddress, 
    selectedToken,
    balances,
    formattedBalance,
    isLoading, 
    error, 
    isCorrectNetwork,
    chainId,
    connectWallet, 
    disconnectWallet,
    switchNetwork,
    refreshBalance,
    clearError
  } = useWallet();

  const handleConnect = async () => {
    clearError();
    
    if (!isMetaMaskInstalled()) {
      // Show installation instructions
      return;
    }
    
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  };

  const handleSwitchNetwork = async () => {
    clearError();
    try {
      await switchNetwork();
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance(true); // Force refresh
    } catch (error) {
      console.error('Balance refresh failed:', error);
    }
  };

  // MetaMask not installed
  if (!isMetaMaskInstalled()) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">MetaMask Required</h3>
              <p className="text-xs text-gray-500">Install MetaMask to connect your wallet</p>
            </div>
            <Button
              size="sm"
              onClick={() => window.open(getMetaMaskInstallUrl(), '_blank')}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Install</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact view for header
  if (compact) {
    if (!isConnected) {
      return (
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          size="sm"
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Connecting...' : 'Connect'}</span>
        </Button>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        {!isCorrectNetwork && (
          <Button
            onClick={handleSwitchNetwork}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-orange-600 border-orange-200"
          >
            Switch Network
          </Button>
        )}
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">{formattedAddress}</span>
        </div>
      </div>
    );
  }

  // Full wallet connection card
  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearError}
              className="text-red-600 hover:text-red-700"
            >
              ×
            </Button>
          </div>
        )}

        {!isConnected ? (
          // Connection UI
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Connect your MetaMask wallet to start making crypto-to-UPI payments
            </p>
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Connecting...' : 'Connect MetaMask'}</span>
            </Button>
          </div>
        ) : (
          // Connected UI
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Wallet Connected</h3>
                  <p className="text-xs text-gray-500 font-mono">{formattedAddress}</p>
                </div>
              </div>
              <Button
                onClick={handleDisconnect}
                size="sm"
                variant="outline"
                disabled={isLoading}
              >
                Disconnect
              </Button>
            </div>

            {/* Network Status */}
            {!isCorrectNetwork && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-700">Wrong Network</span>
                  </div>
                  <Button
                    onClick={handleSwitchNetwork}
                    size="sm"
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    Switch to Polygon
                  </Button>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Please switch to Polygon network to use USDT and MATIC
                </p>
              </div>
            )}

            {/* Balance Display */}
            {showBalance && isCorrectNetwork && (
              <div className="space-y-3">
                {/* USDT Balance */}
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                        <span className="text-yellow-700 font-bold text-xs">₮</span>
                      </div>
                      <div>
                        <p className="text-xs text-yellow-700 font-medium">USDT Balance</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {parseFloat(balances.USDT.balance).toFixed(6)} USDT
                        </p>
                      </div>
                    </div>
                    {parseFloat(balances.USDT.balance) === 0 && (
                      <div className="text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded">
                        ⚠️ Need USDT
                      </div>
                    )}
                  </div>
                </div>

                {/* MATIC Balance */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                        <span className="text-purple-700 font-bold text-xs">◆</span>
                      </div>
                      <div>
                        <p className="text-xs text-purple-700 font-medium">MATIC Balance</p>
                        <p className="text-lg font-bold text-purple-800">
                          {parseFloat(balances.MATIC.balance).toFixed(6)} MATIC
                        </p>
                      </div>
                    </div>
                    {parseFloat(balances.MATIC.balance) === 0 && (
                      <div className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded">
                        ⚠️ Need MATIC
                      </div>
                    )}
                  </div>
                </div>

                {/* Refresh Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleRefreshBalance}
                    size="sm"
                    variant="outline"
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Balances</span>
                  </Button>
                </div>

                {/* Warning if no balance in either token */}
                {parseFloat(balances.USDT.balance) === 0 && parseFloat(balances.MATIC.balance) === 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-700 font-medium">
                        You need USDT or MATIC in your wallet to make payments
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};