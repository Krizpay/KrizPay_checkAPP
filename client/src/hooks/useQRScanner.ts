import { useState, useCallback } from "react";

export function useQRScanner(onQRScanned: (data: string) => void) {
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const extractUPIId = (qrData: string): string | null => {
    // Common UPI QR code patterns
    const patterns = [
      /upi:\/\/pay\?.*pa=([^&]+)/i,
      /pa=([^&\s]+)/i,
      /([a-zA-Z0-9\.\-_]+@[a-zA-Z0-9\.\-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = qrData.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const startScanning = useCallback(() => {
    setIsScanning(true);
    setError("");
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setError("");
  }, []);

  const handleQRScan = useCallback((result: string) => {
    console.log("QR Code detected:", result);
    const upiId = extractUPIId(result);
    if (upiId) {
      console.log("UPI ID extracted:", upiId);
      onQRScanned(upiId);
      setIsScanning(false);
    } else {
      console.log("No valid UPI ID found in QR code");
      setError("QR code found but no valid UPI ID detected");
    }
  }, [onQRScanned, extractUPIId]);

  const handleFileUpload = useCallback((file: File) => {
    // File upload scanning will be handled by the new QR scanner component
    console.log("File upload:", file.name);
  }, []);

  return {
    isScanning,
    startScanning,
    stopScanning,
    handleFileUpload,
    handleQRScan,
    error,
  };
}
