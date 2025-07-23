import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import type { Transaction } from "@shared/schema";

interface TransactionStatusProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionStatus({ transaction, onClose }: TransactionStatusProps) {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-success" />;
      case "failed":
        return <AlertCircle className="w-8 h-8 text-destructive" />;
      case "processing":
        return <Loader2 className="w-8 h-8 text-crypto animate-spin" />;
      default:
        return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (transaction.status) {
      case "success":
        return "Payment Successful!";
      case "failed":
        return "Payment Failed";
      case "processing":
        return "Processing Payment";
      default:
        return "Payment Pending";
    }
  };

  const getStatusMessage = () => {
    switch (transaction.status) {
      case "success":
        return `₹${parseFloat(transaction.inrAmount).toLocaleString("en-IN")} has been sent to ${transaction.upiId}`;
      case "failed":
        return "The payment could not be processed. Please try again.";
      case "processing":
        return "Please confirm the transaction in your wallet";
      default:
        return "Your payment is being processed";
    }
  };

  const steps = [
    {
      label: "Wallet signature confirmed",
      completed: transaction.status !== "pending",
      active: transaction.status === "pending",
    },
    {
      label: "Converting crypto to INR",
      completed: transaction.status === "success",
      active: transaction.status === "processing",
    },
    {
      label: "Transferring to merchant UPI",
      completed: transaction.status === "success",
      active: false,
    },
  ];

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-w-sm">
        <div className="text-center">
          {/* Status Icon */}
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            {getStatusIcon()}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getStatusTitle()}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {getStatusMessage()}
          </p>
          
          {/* Transaction Steps */}
          {transaction.status !== "success" && transaction.status !== "failed" && (
            <div className="space-y-3 mb-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.completed
                      ? "bg-success"
                      : step.active
                      ? "bg-crypto"
                      : "bg-gray-300"
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : step.active ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    step.completed || step.active ? "text-gray-700" : "text-gray-500"
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Transaction ID */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
            <div className="text-sm font-mono text-gray-700 break-all">
              {transaction.merchantTxId}
            </div>
            {transaction.txHash && (
              <>
                <div className="text-xs text-gray-500 mb-1 mt-2">Transaction Hash</div>
                <div className="text-xs font-mono text-gray-700 break-all">
                  {transaction.txHash}
                </div>
              </>
            )}
          </div>

          {transaction.status === "success" ? (
            <div className="space-y-3">
              <Button onClick={onClose} className="w-full">
                Make Another Payment
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onClose} className="text-sm">
              View Details
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
