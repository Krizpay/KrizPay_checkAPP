import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, Upload, CheckCircle, XCircle } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRScannerProps {
  onQRScanned: (upiId: string) => void;
  scannedUPIId: string;
}

export function QRScanner({ onQRScanned, scannedUPIId }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Extract UPI ID from QR code data
  const extractUPIId = (data: string): string | null => {
    // Check if it's a UPI URL format: upi://pay?pa=example@upi&...
    const upiMatch = data.match(/upi:\/\/pay\?.*pa=([^&]+)/);
    if (upiMatch) {
      return upiMatch[1];
    }

    // Check if it's just a UPI ID: merchant@paytm
    const directUpiMatch = data.match(/^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/);
    if (directUpiMatch) {
      return data;
    }

    return null;
  };

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const qrData = result[0].rawValue;
      console.log("QR Code detected:", qrData);
      
      const upiId = extractUPIId(qrData);
      if (upiId) {
        console.log("UPI ID extracted:", upiId);
        setSuccess(`UPI ID found: ${upiId}`);
        setError("");
        onQRScanned(upiId);
        setIsScanning(false);
      } else {
        console.log("No valid UPI ID found in QR code");
        setError("QR code found but no valid UPI ID detected");
        setSuccess("");
      }
    }
  };

  const handleError = (error: any) => {
    console.error("QR Scanner error:", error);
    if (error?.name === "NotAllowedError") {
      setError("Camera access denied. Please allow camera access and try again.");
    } else if (error?.name === "NotFoundError") {
      setError("No camera found on this device.");
    } else if (error?.name === "NotSupportedError") {
      setError("Camera not supported. Please use HTTPS or try uploading an image.");
    } else {
      setError("Failed to access camera. Please try again or upload an image.");
    }
    setSuccess("");
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setError("");
    setSuccess("");
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setError("");
    setSuccess("");
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Scan UPI QR Code</h2>
          <p className="text-sm text-muted-foreground">Point your camera at the merchant's QR code</p>
        </div>

        {/* Camera View */}
        <div className="relative bg-muted rounded-lg overflow-hidden mb-4 aspect-square">
          {isScanning ? (
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{
                facingMode: 'environment',
                aspectRatio: 1,
              }}
              styles={{
                container: { 
                  width: '100%', 
                  height: '100%',
                  position: 'relative'
                },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }
              }}
              components={{
                finder: false,
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-primary/20 flex items-center justify-center">
              <div className="text-center text-primary-foreground">
                <Camera className="w-12 h-12 mb-3 opacity-70 mx-auto" />
                <p className="text-sm opacity-90">Camera will appear here</p>
                <p className="text-xs opacity-70 mt-2">Allow camera access when prompted</p>
                <p className="text-xs opacity-50 mt-1">Make sure you're using HTTPS</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Scanned UPI Display */}
        {scannedUPIId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">UPI ID Scanned</span>
              </div>
            </div>
            <p className="text-sm font-mono text-blue-600 mt-1">{scannedUPIId}</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="space-y-3">
          {!isScanning ? (
            <Button 
              onClick={handleStartScanning}
              className="w-full flex items-center justify-center space-x-2"
              disabled={!!scannedUPIId}
            >
              <Camera className="w-4 h-4" />
              <span>Start Scanning</span>
            </Button>
          ) : (
            <Button 
              onClick={handleStopScanning}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <span>Stop Scanning</span>
            </Button>
          )}

          {/* File Upload Alternative */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Or upload a QR code image</p>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    // For now, just show message that file upload is selected
                    setError("File upload scanning coming soon. Please use camera for now.");
                  }
                };
                input.click();
              }}
              className="text-xs"
            >
              <Upload className="w-3 h-3 mr-1" />
              Upload Image
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}