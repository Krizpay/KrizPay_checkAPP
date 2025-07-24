import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useWallet";
import { RefreshCw, Coins, Zap } from "lucide-react";

interface AmountInputProps {
  inrAmount: number;
  onAmountChange: (amount: number) => void;
  disabled?: boolean;
}

export function AmountInput({ inrAmount, onAmountChange, disabled = false }: AmountInputProps) {
  const [inputValue, setInputValue] = useState<string>(inrAmount.toString());
  const { selectedToken } = useWallet();

  // Query for both USDT and MATIC exchange rates
  const { data: usdtRate, refetch: refreshUsdtRate, isLoading: isUsdtLoading } = useQuery<{
    id: number;
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    updatedAt: Date;
  }>({
    queryKey: ["/api/exchange-rate/usdt/inr"],
    refetchInterval: 30000,
  });

  const { data: maticRate, refetch: refreshMaticRate, isLoading: isMaticLoading } = useQuery<{
    id: number;
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    updatedAt: Date;
  }>({
    queryKey: ["/api/exchange-rate/matic/inr"],
    refetchInterval: 30000,
  });

  const currentRate = selectedToken === 'USDT' ? usdtRate : maticRate;
  const isLoading = selectedToken === 'USDT' ? isUsdtLoading : isMaticLoading;

  useEffect(() => {
    setInputValue(inrAmount.toString());
  }, [inrAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseFloat(value) || 0;
    onAmountChange(numValue);
  };

  const calculateTokenAmount = (inr: number): number => {
    if (!currentRate || !currentRate.rate || inr === 0) return 0;
    return inr / parseFloat(currentRate.rate);
  };

  const calculatedTokenAmount = calculateTokenAmount(inrAmount);

  const refreshRate = () => {
    if (selectedToken === 'USDT') {
      refreshUsdtRate();
    } else {
      refreshMaticRate();
    }
  };

  const getTokenIcon = () => {
    return selectedToken === 'USDT' ? Coins : Zap;
  };

  const getTokenColor = () => {
    return selectedToken === 'USDT' ? 'text-yellow-600' : 'text-purple-600';
  };

  return (
    <Card className={disabled ? "opacity-50" : ""}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Payment Amount</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="inr-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount in INR
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                ₹
              </span>
              <Input
                id="inr-amount"
                type="number"
                placeholder="0.00"
                value={inputValue}
                onChange={handleInputChange}
                disabled={disabled}
                className="pl-8 text-lg font-medium"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Rate Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Current Rate</span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-900">
                  {currentRate && currentRate.rate ? `1 ${selectedToken} = ₹${parseFloat(currentRate.rate).toFixed(2)}` : "Loading..."}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshRate}
                  disabled={isLoading}
                  className="w-6 h-6 p-0"
                >
                  <RefreshCw className={`w-3 h-3 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            
            {/* Token Amount Display */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">You'll pay</span>
                <div className="text-right">
                  <div className={`text-lg font-bold flex items-center space-x-1 ${getTokenColor()}`}>
                    {React.createElement(getTokenIcon(), { className: "w-4 h-4" })}
                    <span>{calculatedTokenAmount.toFixed(6)} {selectedToken}</span>
                  </div>
                  <div className="text-xs text-gray-500">on Polygon Network</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fees Breakdown */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Network Fee:</span>
              <span>~$0.01</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee:</span>
              <span>1.5%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
