import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQRScanner } from "@/hooks/useQRScanner";
import { QrCode, Camera, Upload, CheckCircle } from "lucide-react";

interface QRScannerProps {
  onQRScanned: (upiId: string) => void;
  scannedUPIId: string;
}

export function QRScanner({ onQRScanned, scannedUPIId }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startScanning, stopScanning, videoRef, handleFileUpload, error } = useQRScanner(onQRScanned);

  const handleStartScanning = async () => {
    try {
      await startScanning();
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanning:", err);
    }
  };

  const handleStopScanning = () => {
    stopScanning();
    setIsScanning(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Scan UPI QR Code</h2>
          <p className="text-sm text-gray-600">Point your camera at the merchant's QR code</p>
        </div>

        {/* Camera View */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4 aspect-square">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mb-3 opacity-50 mx-auto" />
                <p className="text-sm opacity-75">Camera will appear here</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex space-x-3 mb-4">
          {!isScanning ? (
            <Button 
              onClick={handleStartScanning}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button 
              onClick={handleStopScanning}
              variant="outline"
              className="flex-1"
            >
              Stop Scanning
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="px-4"
          >
            <Upload className="w-4 h-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Detected UPI ID Display */}
        {scannedUPIId && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">UPI ID Detected:</span>
              <span className="text-sm text-success font-mono">{scannedUPIId}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
