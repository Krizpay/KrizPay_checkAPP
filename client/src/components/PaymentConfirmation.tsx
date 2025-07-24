import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Wallet, ArrowRight, Coins } from "lucide-react";

interface PaymentConfirmationProps {
  upiId: string;
  inrAmount: number;
  walletConnected: boolean;
  walletAddress?: string;
  balance?: number;
  onPaymentInitiated: (transaction: any) => void;
}

export function PaymentConfirmation({
  upiId,
  inrAmount,
  walletConnected,
  walletAddress,
  balance = 0,
  onPaymentInitiated,
}: PaymentConfirmationProps) {
  const { toast } = useToast();

  const { data: exchangeRate } = useQuery<{
    id: number;
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    updatedAt: Date;
  }>({
    queryKey: ["/api/exchange-rate/usdt/inr"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      return response.json();
    },
    onSuccess: (transaction) => {
      onPaymentInitiated(transaction);
      initiatePaymentMutation.mutate({
        merchantTxId: transaction.merchantTxId,
        upiId: transaction.upiId,
        inrAmount: transaction.inrAmount,
        usdtAmount: transaction.usdtAmount,
        walletAddress,
      });
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

  const calculateUSDT = (): number => {
    if (!exchangeRate || !exchangeRate.rate || inrAmount === 0) return 0;
    return inrAmount / parseFloat(exchangeRate.rate);
  };

  const finalUSDTAmount = calculateUSDT();

  const handlePayment = async () => {
    if (!walletConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (balance < finalUSDTAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough USDT for this transaction",
        variant: "destructive",
      });
      return;
    }

    const merchantTxId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const transactionData = {
      merchantTxId,
      upiId,
      inrAmount: inrAmount.toString(),
      usdtAmount: finalUSDTAmount.toString(),
      cryptoType: "usdt",
      chain: "polygon",
      status: "pending",
      walletAddress,
    };

    createTransactionMutation.mutate(transactionData);
  };

  const isLoading = createTransactionMutation.isPending || initiatePaymentMutation.isPending;

  return (
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
            <span className="text-sm font-bold text-crypto">{finalUSDTAmount.toFixed(6)} USDT</span>
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
        {walletConnected && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">USDT Balance:</span>
              <span className="text-sm font-medium text-gray-900">{balance.toFixed(6)} USDT</span>
            </div>
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
            disabled={!walletConnected || finalUSDTAmount === 0}
            className="w-full py-4 text-lg font-semibold relative overflow-hidden group hover:scale-105 transition-transform duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center">
              <Send className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Pay Now
            </div>
          </Button>
        )}

        {!walletConnected && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Connect your wallet to proceed with payment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
