# Implementation Plan

- [x] 1. Set up MetaMask detection and Onmeta integration infrastructure


  - Install ethers.js library for blockchain interactions
  - Create wallet detection utility to check for MetaMask presence
  - Set up TypeScript interfaces for wallet state, Onmeta API, and configuration
  - Create Onmeta API client with proper error handling and retry logic
  - _Requirements: 1.2, 1.3_

- [ ] 2. Create core wallet context and provider
  - [x] 2.1 Implement WalletContext with React Context API


    - Create WalletContext with initial state management
    - Define wallet state interface with connection status, address, balance
    - Implement context provider component with state management
    - _Requirements: 1.1, 1.5, 6.1_

  - [x] 2.2 Create useWallet custom hook


    - Implement useWallet hook to consume wallet context
    - Add wallet connection and disconnection methods
    - Include error handling and loading states
    - _Requirements: 1.1, 1.5, 5.1_

- [ ] 3. Implement MetaMask connection functionality
  - [x] 3.1 Create wallet connection logic


    - Implement connectWallet function with MetaMask ethereum.request
    - Handle user approval and rejection scenarios
    - Store wallet address and connection state
    - _Requirements: 1.4, 1.5, 8.2_

  - [x] 3.2 Add connection persistence


    - Implement localStorage for connection preference storage
    - Create auto-reconnection logic on app startup
    - Handle account changes and disconnection detection
    - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [ ] 4. Implement Polygon network management
  - [x] 4.1 Create network detection and switching


    - Implement network checking with ethereum.request('eth_chainId')
    - Create switchToPolygon function with wallet_switchEthereumChain
    - Add Polygon network configuration with wallet_addEthereumChain
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.2 Add network status monitoring


    - Listen for chainChanged events from MetaMask
    - Update UI based on current network status
    - Disable payment functionality when on wrong network
    - _Requirements: 3.5, 3.6_

- [ ] 5. Create USDT balance management
  - [x] 5.1 Implement USDT contract interaction


    - Set up ethers.js contract instance for USDT on Polygon
    - Create getUSDTBalance function using contract.balanceOf
    - Implement balance formatting with proper decimal handling
    - _Requirements: 2.1, 2.4_

  - [x] 5.2 Add balance refresh and caching


    - Implement automatic balance refresh on wallet connection
    - Add manual refresh functionality with loading states
    - Create balance caching with 30-second TTL
    - _Requirements: 2.2, 2.3, 2.5_

- [ ] 6. Build wallet connection UI components
  - [x] 6.1 Create WalletConnection component


    - Build connect/disconnect button with loading states
    - Display truncated wallet address when connected
    - Add MetaMask installation detection and instructions
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 6.2 Create balance display component


    - Show USDT balance with proper formatting
    - Add loading spinner during balance fetch
    - Display error states with retry functionality
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. Implement Onmeta API integration for offramp orders
  - [ ] 7.1 Create Onmeta quote and order management
    - Implement getOnmetaQuote function to fetch real-time exchange rates
    - Create createOfframpOrder function using Onmeta's /v1/offramp/orders/create endpoint
    - Add proper request validation and error handling for Onmeta API calls
    - Implement order status polling using /v1/transactions/{id} endpoint
    - _Requirements: 4.1, 4.2_

  - [ ] 7.2 Integrate MetaMask with Onmeta payment flow
    - Create complete payment flow: Quote → Order → MetaMask Transfer → Status Tracking
    - Implement USDT transfer to Onmeta's receiver wallet address
    - Add transaction hash submission to Onmeta for order completion
    - Handle Onmeta webhook responses for real-time status updates
    - _Requirements: 4.3, 4.4, 4.5_

- [ ] 8. Implement transaction handling with Onmeta integration
  - [x] 8.1 Create USDT transfer functionality for Onmeta orders


    - Implement sendUSDTToOnmeta function with contract.transfer to receiver address
    - Add transaction preparation with Onmeta order details
    - Handle MetaMask transaction approval flow with proper gas estimation
    - Integrate with existing Onmeta order creation from server routes
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 8.2 Add comprehensive transaction status tracking
    - Monitor blockchain transaction confirmation with ethers.js
    - Track Onmeta order status through API polling and webhooks
    - Update UI with both blockchain hash and Onmeta order status
    - Handle transaction success, failure, and timeout scenarios
    - _Requirements: 4.4, 4.5, 4.6_

- [ ] 9. Implement comprehensive error handling with Onmeta-specific errors
  - [ ] 9.1 Create error types and handling utilities for Onmeta integration
    - Define WalletErrorType enum including Onmeta API errors (ORDER_FAILED, INSUFFICIENT_LIQUIDITY, etc.)
    - Implement error handling functions for Onmeta API responses and blockchain errors
    - Create user-friendly error messages for Onmeta order failures and recovery actions
    - Add specific error handling for Onmeta webhook failures and timeout scenarios
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 9.2 Add error boundary and recovery mechanisms
    - Implement React error boundary for wallet and Onmeta API errors
    - Add retry functionality for failed Onmeta orders and blockchain transactions
    - Create error logging for debugging Onmeta integration issues
    - Implement fallback mechanisms when Onmeta API is unavailable
    - _Requirements: 5.4, 5.5, 5.6_

- [ ] 10. Add mobile MetaMask support with Onmeta mobile optimization
  - [ ] 10.1 Implement mobile detection and deep linking
    - Detect mobile devices and MetaMask mobile app presence
    - Create deep linking functionality for MetaMask mobile
    - Add fallback to app store links when not installed
    - Optimize Onmeta payment flow for mobile MetaMask app switching
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 10.2 Optimize mobile user experience with Onmeta integration
    - Implement mobile-specific transaction flow with Onmeta order handling
    - Add QR code option for MetaMask mobile connection
    - Handle app switching and return detection during Onmeta payments
    - Optimize mobile UI for Onmeta order status updates
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

- [ ] 11. Create real-time feedback and loading states for Onmeta integration
  - [ ] 11.1 Implement loading indicators with Onmeta status updates
    - Add loading states for all wallet operations and Onmeta API calls
    - Create animated progress indicators for Onmeta order creation and blockchain transactions
    - Display "Check MetaMask" prompts during user actions and Onmeta order processing
    - Show real-time Onmeta order status updates with visual feedback
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.2 Add success and error feedback for Onmeta integration
    - Implement success animations for completed Onmeta orders and blockchain transactions
    - Create clear error messages for Onmeta API failures with actionable instructions
    - Add toast notifications for wallet events and Onmeta order status changes
    - Display Onmeta-specific error codes with user-friendly explanations
    - _Requirements: 5.4, 5.5, 5.6_

- [ ] 12. Integrate wallet functionality with existing payment flow and Onmeta system
  - [x] 12.1 Update PaymentConfirmation component with Onmeta integration



    - Integrate wallet balance check before Onmeta order creation
    - Add insufficient balance warnings with USDT-specific messaging
    - Connect USDT transfer with Onmeta payment flow and order tracking
    - Display Onmeta quote information (exchange rate, fees, gas estimates)
    - _Requirements: 2.6, 4.1_

  - [ ] 12.2 Update transaction status handling with Onmeta order tracking
    - Link blockchain transaction hash with Onmeta order status
    - Update TransactionStatus component with wallet info and Onmeta order details
    - Add blockchain explorer links for USDT transactions
    - Display Onmeta order ID and status alongside blockchain confirmation
    - _Requirements: 4.4, 4.5_

- [ ] 13. Add comprehensive testing for MetaMask and Onmeta integration
  - [ ] 13.1 Write unit tests for wallet and Onmeta functionality
    - Test wallet context and useWallet hook with Onmeta integration
    - Test network switching and balance fetching with error scenarios
    - Test Onmeta API client functions and error handling mechanisms
    - Test Onmeta order creation, status tracking, and webhook handling
    - _Requirements: All requirements_

  - [ ] 13.2 Create integration tests for complete payment flow
    - Test complete wallet connection flow with Onmeta order creation
    - Test transaction execution and monitoring with Onmeta status updates
    - Test mobile MetaMask integration with Onmeta mobile optimization
    - Test error recovery scenarios for both MetaMask and Onmeta failures
    - _Requirements: All requirements_

- [ ] 14. Optimize performance and add caching for MetaMask and Onmeta
  - [ ] 13.1 Implement caching strategies
    - Add balance caching with TTL
    - Cache network status and configuration
    - Implement efficient state updates
    - _Requirements: 2.5, 6.5_

  - [ ] 13.2 Add performance monitoring
    - Monitor wallet operation performance
    - Add metrics for transaction success rates
    - Implement error tracking and reporting
    - _Requirements: 5.1, 5.2_

- [ ] 14. Final integration and testing
  - [ ] 14.1 Complete end-to-end testing
    - Test full payment flow with MetaMask
    - Verify mobile compatibility and deep linking
    - Test error scenarios and recovery
    - _Requirements: All requirements_

  - [ ] 14.2 Deploy and monitor
    - Deploy MetaMask integration to production
    - Monitor wallet connection success rates
    - Track transaction completion rates
    - _Requirements: All requirements_