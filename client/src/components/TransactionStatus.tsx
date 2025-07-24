import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Loader2, AlertCircle, XCircle, RefreshCw, ExternalLink, Copy, Wallet, ArrowRight, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import type { Transaction } from "@shared/schema";

interface TransactionStatusProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionStatus({ transaction, onClose }: TransactionStatusProps) {
  const [copied, setCopied] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Animation progression based on transaction status
  useEffect(() => {
    if (transaction.status === "pending") {
      setAnimationStep(1);
    } else if (transaction.status === "processing") {
      setAnimationStep(2);
    } else if (transaction.status === "success") {
      setAnimationStep(3);
    } else if (transaction.status === "failed") {
      setAnimationStep(0);
    }
  }, [transaction.status]);

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "failed":
        return <XCircle className="w-12 h-12 text-red-500" />;
      case "processing":
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-12 h-12 text-yellow-500" />;
      default:
        return <AlertCircle className="w-12 h-12 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "processing":
        return "bg-blue-50 border-blue-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusTitle = () => {
    switch (transaction.status) {
      case "success":
        return "Payment Successful! ✅";
      case "failed":
        return "Payment Failed ❌";
      case "processing":
        return "Processing Payment ⏳";
      case "pending":
        return "Payment Pending ⏱️";
      default:
        return "Unknown Status";
    }
  };

  const getStatusMessage = () => {
    switch (transaction.status) {
      case "success":
        return `₹${parseFloat(transaction.inrAmount).toLocaleString("en-IN")} has been successfully sent to ${transaction.upiId}. The merchant should receive the payment shortly.`;
      case "failed":
        return "The payment could not be processed. This could be due to insufficient funds, network issues, or merchant account problems. Please check your wallet and try again.";
      case "processing":
        return "Your transaction is being processed. Please confirm the transaction in your MetaMask wallet and wait for blockchain confirmation.";
      case "pending":
        return "Your payment is waiting for wallet confirmation. Please check your MetaMask wallet to approve the transaction.";
      default:
        return "Transaction status is unknown. Please contact support if this persists.";
    }
  };

  const getFailureReason = () => {
    // You can extend this based on actual error codes from Onmeta API
    if (transaction.status === "failed") {
      return [
        "• Insufficient USDT balance in wallet",
        "• Network congestion or high gas fees", 
        "• Invalid UPI ID or merchant account issues",
        "• Transaction timeout or blockchain rejection"
      ];
    }
    return [];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          
          {/* Status-specific Content */}
          {transaction.status === "failed" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Possible Reasons:</h4>
              <div className="text-xs text-red-700 space-y-1">
                {getFailureReason().map((reason, index) => (
                  <div key={index}>{reason}</div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Payment Animation */}
          {(transaction.status === "pending" || transaction.status === "processing") && (
            <div className="mb-8">
              {/* Animated Payment Flow */}
              <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between relative">
                  {/* Wallet Icon */}
                  <div className={`relative transition-all duration-1000 ${animationStep >= 1 ? 'scale-110' : 'scale-100'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      animationStep >= 1 ? 'bg-blue-500 shadow-lg' : 'bg-gray-300'
                    }`}>
                      <Wallet className={`w-6 h-6 transition-colors duration-500 ${
                        animationStep >= 1 ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    {animationStep >= 1 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                    )}
                  </div>

                  {/* Animated Arrow 1 */}
                  <div className="flex-1 mx-4 relative">
                    <div className={`h-0.5 bg-gradient-to-r transition-all duration-1000 ${
                      animationStep >= 1 ? 'from-blue-500 to-purple-500 w-full' : 'from-gray-300 to-gray-300 w-0'
                    }`}></div>
                    <ArrowRight className={`absolute top-1/2 right-0 transform -translate-y-1/2 w-4 h-4 transition-all duration-1000 ${
                      animationStep >= 1 ? 'text-purple-500 animate-pulse' : 'text-gray-300'
                    }`} />
                    {/* Floating USDT particles */}
                    {animationStep >= 1 && (
                      <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                      </div>
                    )}
                    {animationStep >= 1 && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    )}
                    {animationStep >= 1 && (
                      <div className="absolute top-1/2 left-3/4 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    )}
                  </div>

                  {/* Conversion Icon */}
                  <div className={`relative transition-all duration-1000 ${animationStep >= 2 ? 'scale-110' : 'scale-100'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      animationStep >= 2 ? 'bg-purple-500 shadow-lg' : 'bg-gray-300'
                    }`}>
                      <Coins className={`w-6 h-6 transition-colors duration-500 ${
                        animationStep >= 2 ? 'text-white animate-spin' : 'text-gray-500'
                      }`} />
                    </div>
                    {animationStep >= 2 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping"></div>
                    )}
                  </div>

                  {/* Animated Arrow 2 */}
                  <div className="flex-1 mx-4 relative">
                    <div className={`h-0.5 bg-gradient-to-r transition-all duration-1000 ${
                      animationStep >= 2 ? 'from-purple-500 to-green-500 w-full' : 'from-gray-300 to-gray-300 w-0'
                    }`}></div>
                    <ArrowRight className={`absolute top-1/2 right-0 transform -translate-y-1/2 w-4 h-4 transition-all duration-1000 ${
                      animationStep >= 2 ? 'text-green-500 animate-pulse' : 'text-gray-300'
                    }`} />
                    {/* Floating INR particles */}
                    {animationStep >= 2 && (
                      <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      </div>
                    )}
                    {animationStep >= 2 && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                      </div>
                    )}
                    {animationStep >= 2 && (
                      <div className="absolute top-1/2 left-3/4 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                      </div>
                    )}
                  </div>

                  {/* UPI Icon */}
                  <div className={`relative transition-all duration-1000 ${animationStep >= 3 ? 'scale-110' : 'scale-100'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      animationStep >= 3 ? 'bg-green-500 shadow-lg' : 'bg-gray-300'
                    }`}>
                      <CheckCircle className={`w-6 h-6 transition-colors duration-500 ${
                        animationStep >= 3 ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    {animationStep >= 3 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                </div>

                {/* Step Labels */}
                <div className="flex justify-between mt-4 text-xs">
                  <span className={`transition-colors duration-500 ${
                    animationStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}>
                    Wallet
                  </span>
                  <span className={`transition-colors duration-500 ${
                    animationStep >= 2 ? 'text-purple-600 font-medium' : 'text-gray-400'
                  }`}>
                    Converting
                  </span>
                  <span className={`transition-colors duration-500 ${
                    animationStep >= 3 ? 'text-green-600 font-medium' : 'text-gray-400'
                  }`}>
                    UPI Transfer
                  </span>
                </div>
              </div>

              {/* Status Message with Animation */}
              <div className="text-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-500 ${
                  transaction.status === "pending" ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {transaction.status === "pending" ? "Waiting for wallet confirmation..." : "Processing payment..."}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out ${
                    transaction.status === "pending" ? 'w-1/3' : 'w-2/3'
                  }`}
                  style={{
                    background: transaction.status === "pending" 
                      ? 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)'
                      : 'linear-gradient(90deg, #8b5cf6 0%, #10b981 100%)'
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Success Celebration Animation */}
          {transaction.status === "success" && (
            <div className="mb-8">
              {/* Celebration Animation */}
              <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 overflow-hidden">
                {/* Confetti Animation */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${1 + Math.random()}s`
                      }}
                    ></div>
                  ))}
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i + 20}
                      className="absolute w-1 h-4 bg-green-400 animate-pulse"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        transform: `rotate(${Math.random() * 360}deg)`
                      }}
                    ></div>
                  ))}
                </div>

                {/* Success Icon with Pulse */}
                <div className="relative z-10 flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-2 w-12 h-12 bg-green-300 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </div>

                <div className="relative z-10 text-center">
                  <h4 className="text-lg font-bold text-green-800 mb-2 animate-bounce">
                    🎉 Payment Successful! 🎉
                  </h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <div className="flex justify-between items-center">
                      <span>Amount:</span>
                      <span className="font-semibold">₹{parseFloat(transaction.inrAmount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>To:</span>
                      <span className="font-mono text-xs">{transaction.upiId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>USDT Sent:</span>
                      <span className="font-semibold">{parseFloat(transaction.usdtAmount).toFixed(4)} USDT</span>
                    </div>
                  </div>
                </div>

                {/* Success Wave Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div className={`rounded-lg p-4 mb-6 ${getStatusColor()}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Transaction ID</span>
                <button 
                  onClick={() => copyToClipboard(transaction.merchantTxId)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <div className="text-sm font-mono text-gray-700 break-all bg-white p-2 rounded border">
                {transaction.merchantTxId}
              </div>
              
              {transaction.txHash && (
                <>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">Blockchain Hash</span>
                    <a 
                      href={`https://polygonscan.com/tx/${transaction.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View on Explorer</span>
                    </a>
                  </div>
                  <div className="text-xs font-mono text-gray-700 break-all bg-white p-2 rounded border">
                    {transaction.txHash}
                  </div>
                </>
              )}

              {transaction.onmetaTxId && (
                <>
                  <div className="text-xs text-gray-500 mt-3">Onmeta Order ID</div>
                  <div className="text-xs font-mono text-gray-700 break-all bg-white p-2 rounded border">
                    {transaction.onmetaTxId}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {transaction.status === "success" && (
            <div className="space-y-3">
              <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
                Make Another Payment
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}

          {transaction.status === "failed" && (
            <div className="space-y-3">
              <Button onClick={onClose} className="w-full bg-red-600 hover:bg-red-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}

          {(transaction.status === "pending" || transaction.status === "processing") && (
            <div className="space-y-3">
              <Button variant="outline" onClick={onClose} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
