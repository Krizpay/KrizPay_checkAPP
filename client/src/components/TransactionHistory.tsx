import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import type { Transaction } from "@shared/schema";

export function TransactionHistory() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Success</span>;
      case "failed":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>;
      case "processing":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Processing</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
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

        {!transactions || !Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 3).map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className={`p-4 rounded-lg border-l-4 ${
                  transaction.status === "success" ? "bg-green-50 border-l-green-500" :
                  transaction.status === "failed" ? "bg-red-50 border-l-red-500" :
                  transaction.status === "processing" ? "bg-blue-50 border-l-blue-500" :
                  transaction.status === "pending" ? "bg-yellow-50 border-l-yellow-500" :
                  "bg-gray-50 border-l-gray-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{parseFloat(transaction.inrAmount).toLocaleString("en-IN")}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <div className="text-xs text-gray-600">
                        to {transaction.upiId}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(transaction.createdAt!)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      transaction.status === "success" ? "text-green-700" : 
                      transaction.status === "failed" ? "text-red-700" : 
                      transaction.status === "processing" ? "text-blue-700" :
                      transaction.status === "pending" ? "text-yellow-700" :
                      "text-gray-600"
                    }`}>
                      {transaction.status === "failed" ? 
                        "Transaction Failed" : 
                        `${parseFloat(transaction.usdtAmount).toFixed(4)} USDT`
                      }
                    </div>
                    {transaction.txHash && (
                      <div className="text-xs text-gray-500 mt-1">
                        Hash: {transaction.txHash.slice(0, 8)}...
                      </div>
                    )}
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