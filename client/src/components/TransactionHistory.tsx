import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { Transaction } from "@shared/schema";

export function TransactionHistory() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
          </Button>
        </div>

        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 3).map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    {getStatusIcon(transaction.status)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      ₹{parseFloat(transaction.inrAmount).toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-gray-500">
                      to {transaction.upiId}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm ${
                    transaction.status === "success" ? "text-gray-900" : 
                    transaction.status === "failed" ? "text-destructive" : "text-gray-600"
                  }`}>
                    {transaction.status === "failed" ? "Failed" : `${parseFloat(transaction.usdtAmount).toFixed(2)} USDT`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(transaction.createdAt!)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
