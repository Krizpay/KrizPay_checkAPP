import { useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

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
        
        // Start QR code scanning when video is ready
        videoRef.current.onloadedmetadata = () => {
          scanQRCode();
        };
      }

    } catch (err: any) {
      console.error("Error starting camera:", err);
      setError(err.message || "Failed to access camera");
    }
  }, [onQRScanned]);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          const upiId = extractUPIId(code.data);
          if (upiId) {
            onQRScanned(upiId);
            return; // Stop scanning once QR is found
          }
        }
      }
      
      // Continue scanning if stream is active
      if (streamRef.current) {
        requestAnimationFrame(scan);
      }
    };
    
    requestAnimationFrame(scan);
  }, [onQRScanned, extractUPIId]);

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

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          const upiId = extractUPIId(code.data);
          if (upiId) {
            onQRScanned(upiId);
          } else {
            setError("QR code found but no valid UPI ID detected");
          }
        } else {
          setError("No QR code found in the image");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onQRScanned, extractUPIId]);

  return {
    videoRef,
    startScanning,
    stopScanning,
    handleFileUpload,
    error,
  };
}
