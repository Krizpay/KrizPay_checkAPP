// Onmeta API integration utilities

export interface OnmetaPaymentRequest {
  crypto: string;
  chain: string;
  amount: string;
  upi_id: string;
  merchant_tx_id: string;
  wallet_address: string;
  webhook_url?: string;
}

export interface OnmetaPaymentResponse {
  success: boolean;
  transaction_id: string;
  payment_url?: string;
  qr_code?: string;
  status: string;
  message?: string;
}

export interface OnmetaWebhookPayload {
  merchant_tx_id: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  upi_id: string;
  amount: string;
  tx_hash?: string;
  onmeta_tx_id: string;
  timestamp: string;
}

export const initiateOnmetaPayment = async (
  paymentData: OnmetaPaymentRequest
): Promise<OnmetaPaymentResponse> => {
  const apiUrl = import.meta.env.VITE_ONMETA_API_URL || "https://api.onmeta.in/v1/crypto-to-upi";
  const apiKey = import.meta.env.VITE_ONMETA_API_KEY || "your_onmeta_api_key";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Onmeta API error:", error);
    throw error;
  }
};

export const getOnmetaTransactionStatus = async (
  transactionId: string
): Promise<any> => {
  const apiUrl = import.meta.env.VITE_ONMETA_API_URL || "https://api.onmeta.in/v1/transactions";
  const apiKey = import.meta.env.VITE_ONMETA_API_KEY || "your_onmeta_api_key";

  try {
    const response = await fetch(`${apiUrl}/${transactionId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    throw error;
  }
};

export const validateUPIId = (upiId: string): boolean => {
  const upiPattern = /^[a-zA-Z0-9\.\-_]+@[a-zA-Z0-9\.\-_]+$/;
  return upiPattern.test(upiId);
};

export const parseUPIQRCode = (qrData: string): string | null => {
  // Common UPI QR code patterns
  const patterns = [
    /upi:\/\/pay\?.*pa=([^&]+)/i,
    /pa=([^&\s]+)/i,
    /([a-zA-Z0-9\.\-_]+@[a-zA-Z0-9\.\-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = qrData.match(pattern);
    if (match && match[1] && validateUPIId(match[1])) {
      return match[1];
    }
  }

  return null;
};
