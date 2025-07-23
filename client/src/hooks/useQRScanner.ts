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
        throw new Error("Camera access is not supported in this browser. Please use HTTPS or try uploading an image instead.");
      }

      // Try different camera constraints for better compatibility
      let stream: MediaStream;
      try {
        // First try with back camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
        });
      } catch (backCameraError) {
        console.log("Back camera not available, trying front camera");
        // Fallback to front camera or any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
        });
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready and start scanning
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setTimeout(() => scanQRCode(), 500); // Small delay to ensure video is playing
            });
          }
        };
      }

    } catch (err: any) {
      console.error("Error starting camera:", err);
      let errorMessage = "Failed to access camera. ";
      
      if (err.name === "NotAllowedError") {
        errorMessage += "Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (err.name === "NotSupportedError") {
        errorMessage += "Camera not supported in this browser.";
      } else {
        errorMessage += "Please try uploading an image instead.";
      }
      
      setError(errorMessage);
    }
  }, []);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !streamRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const scan = () => {
      if (!streamRef.current || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (canvas.width && canvas.height) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            console.log("QR Code detected:", code.data);
            const upiId = extractUPIId(code.data);
            if (upiId) {
              console.log("UPI ID extracted:", upiId);
              onQRScanned(upiId);
              // Stop scanning once QR is found
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error scanning QR code:", error);
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
