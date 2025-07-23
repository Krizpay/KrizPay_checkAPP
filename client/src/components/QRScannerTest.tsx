import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QRScannerTestProps {
  onQRScanned: (upiId: string) => void;
}

export function QRScannerTest({ onQRScanned }: QRScannerTestProps) {
  const [selectedUPI, setSelectedUPI] = useState<string>("");

  const testUPIs = [
    "merchant@paytm",
    "teststore@phonepe", 
    "shop@gpay",
    "business@upi"
  ];

  const handleUPISelect = (upi: string) => {
    setSelectedUPI(upi);
    onQRScanned(upi);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Test Mode - Select UPI ID</h2>
          <p className="text-sm text-gray-600">Choose a test UPI ID to proceed with payment</p>
        </div>

        <div className="space-y-3">
          {testUPIs.map((upi) => (
            <Button
              key={upi}
              onClick={() => handleUPISelect(upi)}
              variant={selectedUPI === upi ? "default" : "outline"}
              className="w-full justify-start text-left"
            >
              <span className="font-mono">{upi}</span>
            </Button>
          ))}
        </div>

        {selectedUPI && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 text-center">
              Selected: <span className="font-mono">{selectedUPI}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}