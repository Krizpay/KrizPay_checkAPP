import { useRef, useState, useCallback } from "react";
import QrScanner from "qr-scanner";

export function useQRScanner(onQRScanned: (data: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string>("");

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

  const startScanning = useCallback(async () => {
    try {
      setError("");
      
      if (!videoRef.current) {
        throw new Error("Video element not available");
      }

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log("QR Code detected:", result.data);
          const upiId = extractUPIId(result.data);
          if (upiId) {
            console.log("UPI ID extracted:", upiId);
            onQRScanned(upiId);
            // Stop scanning after successful detection
            if (qrScannerRef.current) {
              qrScannerRef.current.stop();
            }
          } else {
            console.log("No valid UPI ID found in QR code");
          }
        },
        {
          onDecodeError: (error) => {
            // This is normal - it means no QR code was found in the frame
            // Don't log these as they happen constantly during scanning
          },
          preferredCamera: 'environment', // Prefer back camera
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      // Start the scanner
      await qrScannerRef.current.start();
      console.log("QR Scanner started successfully");
      
    } catch (err: any) {
      console.error("Error starting QR scanner:", err);
      let errorMessage = "Failed to access camera. ";
      
      if (err.name === "NotAllowedError") {
        errorMessage += "Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (err.name === "NotSupportedError" || err.message.includes("not supported")) {
        errorMessage += "Camera not supported in this browser. Please use HTTPS.";
      } else {
        errorMessage += "Please try uploading an image instead.";
      }
      
      setError(errorMessage);
    }
  }, [onQRScanned, extractUPIId]);

  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
      console.log("QR Scanner stopped");
    }
    
    setError("");
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError("");
      console.log("Scanning uploaded file for QR code");
      
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });
      
      console.log("QR Code detected in file:", result.data);
      const upiId = extractUPIId(result.data);
      if (upiId) {
        onQRScanned(upiId);
      } else {
        setError("QR code found but no valid UPI ID detected");
      }
    } catch (error) {
      console.error("Error scanning uploaded file:", error);
      setError("No QR code found in the uploaded image");
    }
  }, [onQRScanned, extractUPIId]);

  return {
    videoRef,
    startScanning,
    stopScanning,
    handleFileUpload,
    error,
  };
}
