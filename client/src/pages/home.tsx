import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/QRScanner";
import { AmountInput } from "@/components/AmountInput";
import { PaymentConfirmation } from "@/components/PaymentConfirmation";
import { TransactionStatus } from "@/components/TransactionStatus";
import { TransactionHistory } from "@/components/TransactionHistory";
import { WalletConnection } from "@/components/WalletConnection";
import { TokenSelector } from "@/components/TokenSelector";
import { useWallet } from "@/hooks/useWallet";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Coins, Settings, HelpCircle } from "lucide-react";

export default function Home() {
  const [scannedUPIId, setScannedUPIId] = useState<string>("");
  const [inrAmount, setInrAmount] = useState<number>(0);
  const [showTransactionStatus, setShowTransactionStatus] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);

  // Wallet context is now available through WalletProvider
  
  useWebSocket((message) => {
    if (message.type === "transaction_updated") {
      setCurrentTransaction(message.transaction);
      if (message.transaction.status === "success") {
        setShowTransactionStatus(false);
      }
    }
  });

  const handleQRScanned = (upiId: string) => {
    setScannedUPIId(upiId);
  };

  const handlePaymentInitiated = (transaction: any) => {
    setCurrentTransaction(transaction);
    setShowTransactionStatus(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border gradient-purple">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Coins className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-white">KrizPay</h1>
            </div>
            <WalletConnection compact={true} showBalance={false} />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Wallet Connection & Balance */}
        <WalletConnection showBalance={true} />

        {/* Token Selector */}
        <TokenSelector />

        {/* QR Scanner */}
        <QRScanner onQRScanned={handleQRScanned} scannedUPIId={scannedUPIId} />

        {/* Amount Input */}
        <AmountInput 
          inrAmount={inrAmount}
          onAmountChange={setInrAmount}
          disabled={!scannedUPIId}
        />

        {/* Payment Confirmation */}
        {scannedUPIId && inrAmount > 0 && (
          <PaymentConfirmation
            upiId={scannedUPIId}
            inrAmount={inrAmount}
            onPaymentInitiated={handlePaymentInitiated}
          />
        )}

        {/* Transaction History */}
        <TransactionHistory />

        {/* Settings Footer */}
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Settings</span>
            </Button>
            <Button 
              variant="outline"
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Support</span>
            </Button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">Powered by Onmeta • v1.0.0</p>
          </div>
        </Card>
      </main>

      {/* Transaction Status Modal */}
      {showTransactionStatus && currentTransaction && (
        <TransactionStatus
          transaction={currentTransaction}
          onClose={() => setShowTransactionStatus(false)}
        />
      )}
    </div>
  );
}
