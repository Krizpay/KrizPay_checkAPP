import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

interface AmountInputProps {
  inrAmount: number;
  onAmountChange: (amount: number) => void;
  disabled?: boolean;
}

export function AmountInput({ inrAmount, onAmountChange, disabled = false }: AmountInputProps) {
  const [inputValue, setInputValue] = useState<string>(inrAmount.toString());

  const { data: exchangeRate, refetch: refreshRate, isLoading } = useQuery({
    queryKey: ["/api/exchange-rate/usdt/inr"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    setInputValue(inrAmount.toString());
  }, [inrAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseFloat(value) || 0;
    onAmountChange(numValue);
  };

  const calculateUSDT = (inr: number): number => {
    if (!exchangeRate?.rate || inr === 0) return 0;
    return inr / parseFloat(exchangeRate.rate);
  };

  const calculatedUSDT = calculateUSDT(inrAmount);

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
                  {exchangeRate ? `1 USDT = ₹${parseFloat(exchangeRate.rate).toFixed(2)}` : "Loading..."}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshRate()}
                  disabled={isLoading}
                  className="w-6 h-6 p-0"
                >
                  <RefreshCw className={`w-3 h-3 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            
            {/* USDT Amount Display */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">You'll pay</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {calculatedUSDT.toFixed(6)} USDT
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
