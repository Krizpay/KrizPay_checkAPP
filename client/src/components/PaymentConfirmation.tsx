import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { OnmetaWidget } from "@/components/OnmetaWidget";
import { Send, Loader2, Wallet, ArrowRight, Coins, AlertTriangle, Zap, CreditCard } from "lucide-react";

interface PaymentConfirmationProps {
  upiId: string;
  inrAmount: number;
  onPaymentInitiated: (transaction: any) => void;
}

export function PaymentConfirmation({
  upiId,
  inrAmount,
  onPaymentInitiated,
}: PaymentConfirmationProps) {
  const { toast } = useToast();
  const wallet = useWallet();
  const [useWidget, setUseWidget] = useState(true); // Toggle between widget and API mode

  // Query for both USDT and MATIC exchange rates
  const { data: usdtRate } = useQuery<{
    id: number;
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    updatedAt: Date;
  }>({
    queryKey: ["/api/exchange-rate/usdt/inr"],
  });

  const { data: maticRate } = useQuery<{
    id: number;
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    updatedAt: Date;
  }>({
    queryKey: ["/api/exchange-rate/matic/inr"],
  });

  const currentRate = wallet.selectedToken === 'USDT' ? usdtRate : maticRate;

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      return response.json();
    },
    onSuccess: (transaction) => {
      onPaymentInitiated(transaction);
      const paymentData = {
        merchantTxId: transaction.merchantTxId,
        upiId: transaction.upiId,
        inrAmount: transaction.inrAmount,
        tokenAmount: transaction.tokenAmount,
        tokenSymbol: wallet.selectedToken,
        walletAddress: wallet.address,
      };
      
      // Add token-specific amount field for backward compatibility
      if (wallet.selectedToken === 'USDT') {
        paymentData.usdtAmount = transaction.tokenAmount;
      } else {
        paymentData.maticAmount = transaction.tokenAmount;
      }
      
      initiatePaymentMutation.mutate(paymentData);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    },
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", "/api/initiate-payment", paymentData);
      return response.json();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate payment",
        variant: "destructive",
      });
    },
  });

  const calculateTokenAmount = (): number => {
    if (!currentRate || !currentRate.rate || inrAmount === 0) return 0;
    return inrAmount / parseFloat(currentRate.rate);
  };

  const finalTokenAmount = calculateTokenAmount();

  const getTokenIcon = () => {
    return wallet.selectedToken === 'USDT' ? Coins : Zap;
  };

  const getTokenColor = () => {
    return wallet.selectedToken === 'USDT' ? 'text-yellow-600' : 'text-purple-600';
  };

  const handlePayment = async () => {
    // Use wallet hook instead of props
    if (!wallet.isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!wallet.isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Polygon network",
        variant: "destructive",
      });
      return;
    }

    const walletBalance = parseFloat(wallet.currentBalance);
    if (walletBalance < finalTokenAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${wallet.selectedToken} for this transaction`,
        variant: "destructive",
      });
      return;
    }

    const merchantTxId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const transactionData = {
      merchantTxId,
      upiId,
      inrAmount: inrAmount.toString(),
      tokenAmount: finalTokenAmount.toString(),
      cryptoType: wallet.selectedToken.toLowerCase(),
      chain: "polygon",
      status: "pending",
      walletAddress: wallet.address,
    };

    createTransactionMutation.mutate(transactionData);
  };

  const handleWidgetSuccess = (data: any) => {
    toast({
      title: "Payment Successful",
      description: `Payment of ₹${inrAmount} completed successfully via widget`,
      variant: "default",
    });
    onPaymentInitiated({
      merchantTxId: data.merchantTxId || `widget_${Date.now()}`,
      status: 'success',
      amount: inrAmount,
      upiId: upiId,
      tokenAmount: finalTokenAmount,
      cryptoType: wallet.selectedToken.toLowerCase()
    });
  };

  const handleWidgetFailure = (error: any) => {
    toast({
      title: "Payment Failed",
      description: error.message || "Widget payment could not be completed",
      variant: "destructive",
    });
  };

  const isLoading = createTransactionMutation.isPending || initiatePaymentMutation.isPending;

  // If using widget mode, show the Onmeta widget
  if (useWidget) {
    return (
      <div className="space-y-4">
        {/* Payment Mode Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Payment Method</h4>
                <p className="text-xs text-gray-500">Choose your preferred payment flow</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={useWidget ? "default" : "outline"}
                  onClick={() => setUseWidget(true)}
                  className="flex items-center space-x-1"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Widget</span>
                </Button>
                <Button
                  size="sm"
                  variant={!useWidget ? "default" : "outline"}
                  onClick={() => setUseWidget(false)}
                  className="flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Direct</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onmeta Widget */}
        <OnmetaWidget
          upiId={upiId}
          inrAmount={inrAmount}
          onPaymentSuccess={handleWidgetSuccess}
          onPaymentFailure={handleWidgetFailure}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Mode Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Payment Method</h4>
              <p className="text-xs text-gray-500">Choose your preferred payment flow</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={useWidget ? "default" : "outline"}
                onClick={() => setUseWidget(true)}
                className="flex items-center space-x-1"
              >
                <CreditCard className="w-3 h-3" />
                <span>Widget</span>
              </Button>
              <Button
                size="sm"
                variant={!useWidget ? "default" : "outline"}
                onClick={() => setUseWidget(false)}
                className="flex items-center space-x-1"
              >
                <Send className="w-3 h-3" />
                <span>Direct</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direct API Payment */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">To:</span>
            <span className="text-sm font-medium text-gray-900">{upiId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-sm font-medium text-gray-900">₹{inrAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">You'll pay:</span>
            <div className={`text-sm font-bold flex items-center space-x-1 ${getTokenColor()}`}>
              {React.createElement(getTokenIcon(), { className: "w-4 h-4" })}
              <span>{finalTokenAmount.toFixed(6)} {wallet.selectedToken}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">Network:</span>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Polygon</span>
            </div>
          </div>
        </div>

        {/* Wallet Balance Display */}
        {wallet.isConnected && wallet.isCorrectNetwork && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{wallet.selectedToken} Balance:</span>
              <span className="text-sm font-medium text-gray-900">{wallet.formattedBalance} {wallet.selectedToken}</span>
            </div>
            {!wallet.hasBalance && (
              <div className="mt-2 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-orange-600">
                  You need {wallet.selectedToken} in your wallet to make payments
                </span>
              </div>
            )}
          </div>
        )}

        {/* Animated Payment Button */}
        {isLoading ? (
          <div className="space-y-4">
            {/* Loading Animation */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-4 mb-3">
                <div className="relative">
                  <Wallet className="w-8 h-8 text-blue-500 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                </div>
                <ArrowRight className="w-6 h-6 text-purple-500 animate-pulse" />
                <div className="relative">
                  <Coins className="w-8 h-8 text-purple-500 animate-spin" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
                </div>
                <ArrowRight className="w-6 h-6 text-green-500 animate-pulse" />
                <div className="relative">
                  <Send className="w-8 h-8 text-green-500 animate-bounce" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">Processing Payment</p>
                <p className="text-xs text-gray-500">Please confirm in your wallet...</p>
              </div>
              {/* Progress bar */}
              <div className="mt-3 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 animate-pulse"></div>
              </div>
            </div>
            <Button disabled className="w-full py-4 text-lg font-semibold bg-gray-400">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </Button>
          </div>
        ) : (
          <Button
            onClick={handlePayment}
            disabled={!wallet.canTransact || finalTokenAmount === 0}
            className="w-full py-4 text-lg font-semibold relative overflow-hidden group hover:scale-105 transition-transform duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center">
              <Send className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Pay Now
            </div>
          </Button>
        )}

        {!wallet.isConnected && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Connect your wallet to proceed with payment
          </p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
