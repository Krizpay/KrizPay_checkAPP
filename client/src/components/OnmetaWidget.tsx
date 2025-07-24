// Onmeta Widget Integration Component

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';

interface OnmetaWidgetProps {
  upiId: string;
  inrAmount: number;
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailure?: (error: any) => void;
  className?: string;
}

declare global {
  interface Window {
    createWidget: any;
    elementId: string;
    apiKey: string;
    environment: string;
    fiatType: string;
    walletAddress: string;
    fiatAmount: number;
    chainId: string;
    tokenSymbol: string;
    tokenAddress: string;
    metaData: string;
    successRedirectUrl: string;
    failureRedirectUrl: string;
  }
}

export const OnmetaWidget: React.FC<OnmetaWidgetProps> = ({
  upiId,
  inrAmount,
  onPaymentSuccess,
  onPaymentFailure,
  className = ''
}) => {
  const { selectedToken, balances, address, isConnected, isCorrectNetwork } = useWallet();
  const { toast } = useToast();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [isWidgetInitialized, setIsWidgetInitialized] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // Calculate token amount based on selected token
  const calculateTokenAmount = (): number => {
    const currentBalance = balances[selectedToken];
    if (!currentBalance || !currentBalance.balance) return 0;
    
    // This is a simplified calculation - in production, you'd get this from exchange rates
    const rate = selectedToken === 'USDT' ? 84.50 : 65.75;
    return inrAmount / rate;
  };

  const tokenAmount = calculateTokenAmount();

  // Load Onmeta widget script
  useEffect(() => {
    const loadOnmetaScript = () => {
      console.log('Loading Onmeta widget script...');
      
      // Remove any existing script first
      const existingScript = document.querySelector('script[src*="widget.onmeta.in"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://widget.onmeta.in/sdk.js';
      script.type = 'text/javascript';
      script.async = true;
      
      script.onload = () => {
        console.log('Onmeta widget script loaded successfully');
        // Check if createWidget is available
        setTimeout(() => {
          if (window.createWidget) {
            console.log('createWidget is available');
            setIsWidgetLoaded(true);
          } else {
            console.error('createWidget not found after script load');
            setWidgetError('Widget not available after script load');
          }
        }, 500);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Onmeta widget script:', error);
        setWidgetError('Failed to load payment widget script');
      };
      
      document.head.appendChild(script);
    };

    loadOnmetaScript();
  }, []);

  // Initialize widget when script is loaded and component is ready
  useEffect(() => {
    if (!isWidgetLoaded || !isConnected || !isCorrectNetwork || isWidgetInitialized) {
      return;
    }

    const initializeWidget = () => {
      try {
        if (!window.createWidget) {
          console.error('Onmeta widget not available');
          setWidgetError('Payment widget not available');
          return;
        }

        console.log('Initializing Onmeta widget...');

        // Set global variables as required by Onmeta widget
        window.elementId = 'onmeta-widget';
        window.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjY4N2YzYTc0Yzc4Nzk3OTNmOGRlNDdmYSIsImFwaUtleSI6IjM5Y2RkZDNjLTI0ODQtNDhlNi1iMDg2LTg2MGMwYzYyZjRhMCIsInVzZXJJZCI6IiIsImV4cCI6MTc4NDcwNDUwMCwiaWF0IjoxNzUzMTY4NTAwfQ.dAmJsRsiD5GcekVbQAhvsEDXd0FTfdwMaauaOoIIZRY';
        window.environment = 'staging';
        window.fiatType = 'inr';
        window.walletAddress = address || '';
        window.fiatAmount = inrAmount;
        window.chainId = '137'; // Polygon mainnet
        window.tokenSymbol = selectedToken;
        window.tokenAddress = selectedToken === 'USDT' 
          ? '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' 
          : '0x0000000000000000000000000000000000001010';
        window.metaData = JSON.stringify({
          upiId: upiId,
          merchantTxId: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tokenAmount: tokenAmount.toString()
        });
        window.successRedirectUrl = `${window.location.origin}/payment-success`;
        window.failureRedirectUrl = `${window.location.origin}/payment-failure`;

        console.log('Widget configuration set:', {
          elementId: window.elementId,
          apiKey: window.apiKey.substring(0, 20) + '...',
          environment: window.environment,
          fiatType: window.fiatType,
          walletAddress: window.walletAddress,
          fiatAmount: window.fiatAmount,
          chainId: window.chainId,
          tokenSymbol: window.tokenSymbol,
          tokenAddress: window.tokenAddress
        });

        // Set up event listeners
        window.createWidget.on('ALL_EVENTS', (data: any) => {
          console.log('Widget event:', data);
        });

        window.createWidget.on('SUCCESS', (data: any) => {
          console.log('Payment success:', data);
          toast({
            title: "Payment Successful",
            description: `Payment of ₹${inrAmount} completed successfully`,
            variant: "default",
          });
          onPaymentSuccess?.(data);
        });

        window.createWidget.on('FAILED', (data: any) => {
          console.error('Payment failed:', data);
          toast({
            title: "Payment Failed",
            description: data.message || "Payment could not be completed",
            variant: "destructive",
          });
          onPaymentFailure?.(data);
        });

        window.createWidget.on('ORDER_EVENTS', (data: any) => {
          console.log('Order event:', data);
          if (data.status === 'created') {
            toast({
              title: "Order Created",
              description: "Please complete the payment to proceed",
              variant: "default",
            });
          }
        });

        window.createWidget.on('ORDER_COMPLETED_EVENTS', (data: any) => {
          console.log('Order completed:', data);
          toast({
            title: "Order Completed",
            description: "Your crypto-to-UPI payment has been processed",
            variant: "default",
          });
        });

        // Initialize the widget
        console.log('Calling createWidget.init()...');
        window.createWidget.init();
        setIsWidgetInitialized(true);
        setWidgetError(null);
        console.log('Widget initialized successfully');

      } catch (error) {
        console.error('Widget initialization error:', error);
        setWidgetError('Failed to initialize payment widget');
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initializeWidget, 100);
  }, [isWidgetLoaded, isConnected, isCorrectNetwork, address, selectedToken, inrAmount, upiId, tokenAmount]);

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
          <p className="text-gray-600 mb-4">Please connect your wallet to proceed with payment</p>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wrong Network</h3>
          <p className="text-gray-600 mb-4">Please switch to Polygon network to proceed</p>
        </CardContent>
      </Card>
    );
  }

  if (widgetError) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Widget Error</h3>
          <p className="text-gray-600 mb-4">{widgetError}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Reload Page</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">To:</span>
              <span className="font-medium">{upiId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">₹{inrAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Using:</span>
              <span className="font-medium">{tokenAmount.toFixed(6)} {selectedToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network:</span>
              <span className="font-medium">Polygon</span>
            </div>
          </div>
        </div>

        {!isWidgetLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Loading payment widget...</span>
          </div>
        ) : (
          <div>
            {/* Onmeta Widget Container */}
            <div 
              id="onmeta-widget" 
              ref={widgetRef}
              className="min-h-[400px] border border-gray-200 rounded-lg"
            />
            
            {!isWidgetInitialized && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Initializing payment...</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Powered by Onmeta • Secure crypto-to-UPI payments</p>
          <p className="mt-1">For testing: Use any 12-digit number as UTR</p>
        </div>
      </CardContent>
    </Card>
  );
};