import { useRef, useState, useCallback } from "react";

export function useQRScanner(onQRScanned: (data: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // For demonstration, simulate QR scanning after 3 seconds
      setTimeout(() => {
        // Simulate successful QR scan
        const simulatedQRData = "upi://pay?pa=merchant@paytm&pn=Merchant&am=100";
        const upiId = extractUPIId(simulatedQRData);
        if (upiId) {
          onQRScanned(upiId);
        }
      }, 3000);

    } catch (err: any) {
      console.error("Error starting camera:", err);
      setError(err.message || "Failed to access camera");
    }
  }, [onQRScanned]);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setError("");
  }, []);

  return {
    videoRef,
    startScanning,
    stopScanning,
    error,
  };
}
