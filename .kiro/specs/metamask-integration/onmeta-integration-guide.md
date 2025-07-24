# Onmeta API Integration Guide for MetaMask

## Overview

This guide outlines how to leverage Onmeta's API documentation to create a seamless MetaMask integration for KrizPay's crypto-to-UPI payment system.

## Onmeta API Endpoints Used

### 1. Offramp Orders API
**Endpoint**: `POST /v1/offramp/orders/create`
**Purpose**: Create crypto-to-UPI conversion orders

```typescript
// Request payload based on Onmeta documentation
const orderRequest: OnmetaOfframpOrder = {
  sellTokenSymbol: "USDT",
  sellTokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
  chainId: 137, // Polygon mainnet
  fiatCurrency: "inr",
  fiatAmount: parseFloat(inrAmount),
  senderWalletAddress: walletAddress, // From MetaMask
  refundWalletAddress: walletAddress, // Same as sender
  bankDetails: {
    accountNumber: "temp", // For instant UPI payout
    ifsc: "temp"
  },
  metaData: {
    merchantTxId: generateUniqueTxId(),
    upiId: scannedUpiId,
    webhook_url: `${BASE_URL}/api/onmeta-webhook`
  }
};
```

### 2. Quote API
**Endpoint**: `GET /v1/quote`
**Purpose**: Get real-time exchange rates and fees

```typescript
const quoteRequest: OnmetaQuoteRequest = {
  sellTokenSymbol: "USDT",
  chainId: 137,
  fiatCurrency: "inr",
  fiatAmount: inrAmount
};
```

### 3. Transaction Status API
**Endpoint**: `GET /v1/transactions/{orderId}`
**Purpose**: Poll order status for real-time updates

### 4. Webhook System
**Endpoint**: Your webhook URL
**Purpose**: Receive real-time status updates

## MetaMask Integration Flow with Onmeta

### Phase 1: Wallet Connection & Setup
1. **Connect MetaMask**: User connects wallet
2. **Network Check**: Ensure Polygon network (Chain ID 137)
3. **Balance Check**: Fetch USDT balance from contract
4. **UPI Scan**: User scans merchant UPI QR code

### Phase 2: Quote & Order Creation
1. **Get Quote**: Call Onmeta quote API for current rates
2. **Display Quote**: Show user exchange rate, fees, gas estimates
3. **Create Order**: Call Onmeta offramp orders API
4. **Get Receiver**: Onmeta returns receiver wallet address

### Phase 3: MetaMask Transaction
1. **Prepare Transaction**: Create USDT transfer to Onmeta receiver
2. **Gas Estimation**: Use ethers.js to estimate gas
3. **MetaMask Approval**: User approves transaction in MetaMask
4. **Submit Transaction**: Send USDT to Onmeta's receiver address

### Phase 4: Status Tracking
1. **Blockchain Monitoring**: Track transaction confirmation
2. **Onmeta Notification**: Submit tx hash to Onmeta
3. **Status Polling**: Poll Onmeta for order status
4. **Webhook Updates**: Receive real-time status via webhooks
5. **UPI Transfer**: Onmeta converts and sends INR to merchant UPI

## Key Implementation Details

### 1. Error Handling Based on Onmeta Documentation

```typescript
enum OnmetaErrorType {
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  ORDER_EXPIRED = 'ORDER_EXPIRED',
  INVALID_UPI_ID = 'INVALID_UPI_ID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WEBHOOK_TIMEOUT = 'WEBHOOK_TIMEOUT'
}

const handleOnmetaError = (error: OnmetaErrorResponse) => {
  switch (error.code) {
    case 'INSUFFICIENT_LIQUIDITY':
      return 'Onmeta has insufficient liquidity for this amount. Please try a smaller amount.';
    case 'ORDER_EXPIRED':
      return 'Order expired. Please create a new payment.';
    case 'INVALID_UPI_ID':
      return 'Invalid UPI ID. Please check the merchant QR code.';
    default:
      return 'Payment processing failed. Please try again.';
  }
};
```

### 2. Real-time Status Updates

```typescript
const trackOrderStatus = async (orderId: string) => {
  const pollInterval = setInterval(async () => {
    try {
      const status = await fetch(`/api/onmeta/orders/${orderId}/status`);
      const data = await status.json();
      
      updateTransactionStatus(data.status);
      
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error('Status polling error:', error);
    }
  }, 5000); // Poll every 5 seconds
};
```

### 3. Webhook Integration

```typescript
// Server-side webhook handler
app.post('/api/onmeta-webhook', (req, res) => {
  const { orderId, status, merchantTxId, txHash } = req.body;
  
  // Update local transaction status
  updateTransactionInDB(merchantTxId, {
    status: status.toLowerCase(),
    onmetaOrderId: orderId,
    blockchainHash: txHash
  });
  
  // Broadcast to connected clients via WebSocket
  broadcastStatusUpdate({
    type: 'onmeta_status_update',
    merchantTxId,
    status,
    orderId
  });
  
  res.json({ success: true });
});
```

### 4. Mobile Optimization for Onmeta

```typescript
const handleMobilePayment = async () => {
  if (isMobile && isMetaMaskMobile) {
    // Create deep link for MetaMask mobile
    const deepLink = `https://metamask.app.link/dapp/${window.location.host}`;
    
    // Store order details for when user returns
    localStorage.setItem('pendingOnmetaOrder', JSON.stringify({
      orderId,
      receiverAddress,
      amount: usdtAmount
    }));
    
    // Redirect to MetaMask mobile
    window.location.href = deepLink;
  }
};
```

## Security Considerations

### 1. API Key Management
- Store Onmeta API key securely in environment variables
- Use different keys for staging and production
- Implement rate limiting for API calls

### 2. Transaction Validation
- Validate all Onmeta responses before processing
- Verify transaction hashes on blockchain
- Implement timeout mechanisms for orders

### 3. Error Logging
- Log all Onmeta API errors for debugging
- Monitor webhook delivery success rates
- Track transaction success/failure rates

## Testing Strategy

### 1. Onmeta API Testing
- Test all API endpoints with various scenarios
- Test error responses and edge cases
- Verify webhook delivery and processing

### 2. Integration Testing
- Test complete payment flow end-to-end
- Test mobile MetaMask integration
- Test error recovery scenarios

### 3. Performance Testing
- Monitor API response times
- Test under high transaction volumes
- Verify webhook processing performance

## Deployment Checklist

- [ ] Onmeta API keys configured in production
- [ ] Webhook URLs updated for production domain
- [ ] Error monitoring and logging set up
- [ ] Rate limiting implemented
- [ ] Mobile deep linking tested
- [ ] Transaction success rates monitored

## Monitoring & Analytics

### Key Metrics to Track
1. **Wallet Connection Rate**: % of users who successfully connect MetaMask
2. **Order Creation Rate**: % of quotes that convert to orders
3. **Transaction Success Rate**: % of MetaMask transactions that succeed
4. **Onmeta Completion Rate**: % of orders that complete successfully
5. **Average Processing Time**: Time from order creation to UPI transfer
6. **Error Rates**: Breakdown of error types and frequencies

### Alerting
- Set up alerts for high error rates
- Monitor Onmeta API availability
- Track webhook delivery failures
- Alert on transaction timeout scenarios

This comprehensive integration leverages Onmeta's robust API to create a seamless crypto-to-UPI payment experience with MetaMask wallet integration.