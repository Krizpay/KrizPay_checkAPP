# KrizPay - Crypto to UPI Payment Application

## Overview

KrizPay is a modern web application that enables crypto-to-UPI payments, allowing users to pay UPI merchants using USDT cryptocurrency. The application features QR code scanning for UPI IDs, real-time exchange rate conversion, wallet integration for crypto transactions, and live transaction status updates via WebSocket connections.

## Recent Changes (Jan 23, 2025)

- Fixed camera access issues with enhanced permission handling and error messages
- Added fallback from back camera to front camera for better mobile compatibility  
- Integrated real jsQR library for actual QR code scanning functionality
- Added test UPI buttons for development and testing when camera isn't available
- Fixed Onmeta API integration with proper staging endpoints and headers
- Enhanced user feedback with camera status indicators and clear error messages

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for build tooling
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with TypeScript configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Real-time Communication**: WebSocket server for live transaction updates
- **API Design**: RESTful API with structured error handling

### Project Structure
- **Monorepo Setup**: Shared schema and types between client and server
- **Client Directory**: React frontend application
- **Server Directory**: Express backend with API routes
- **Shared Directory**: Common TypeScript definitions and database schema

## Key Components

### Database Schema (Drizzle ORM)
- **Users Table**: User authentication with username/password
- **Transactions Table**: Payment records with status tracking, merchant transaction IDs, UPI details, and crypto amounts
- **Exchange Rates Table**: Currency conversion rates between USDT and INR

### Frontend Components
- **QRScanner**: Camera-based QR code scanning for UPI IDs with file upload fallback
- **AmountInput**: INR amount input with real-time USDT conversion display
- **PaymentConfirmation**: Transaction review and initiation interface
- **TransactionStatus**: Real-time payment status with WebSocket updates
- **TransactionHistory**: Historical transaction list with status indicators
- **WalletConnection**: MetaMask wallet integration for crypto transactions

### Backend Services
- **Storage Layer**: Abstract storage interface with in-memory implementation for development
- **Transaction Management**: Create, track, and update payment transactions
- **Exchange Rate Service**: Fetch and cache USDT/INR conversion rates
- **WebSocket Integration**: Real-time broadcasting of transaction status updates

## Data Flow

1. **QR Code Scanning**: User scans merchant UPI QR code to extract UPI ID
2. **Amount Entry**: User enters INR amount, system displays equivalent USDT amount using current exchange rate
3. **Wallet Connection**: User connects MetaMask wallet on Polygon network
4. **Transaction Creation**: System creates transaction record and initiates Onmeta API payment
5. **Real-time Updates**: WebSocket connection provides live status updates during payment processing
6. **Completion**: Transaction status updates to success/failure with transaction hash

## External Dependencies

### Third-party Services
- **Onmeta API**: Crypto-to-UPI payment processing service
- **MetaMask**: Browser wallet for cryptocurrency transactions
- **Polygon Network**: Blockchain network for USDT transactions

### Key Libraries
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **WebSocket (ws)**: Real-time bidirectional communication
- **Zod**: Runtime type validation and schema parsing

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundling for production
- **Replit Integration**: Development environment support

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Vite HMR for rapid frontend development
- **Database**: Neon serverless PostgreSQL with Drizzle migrations
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite build generating static assets
- **Backend**: ESBuild bundling Express server for Node.js deployment
- **Database**: PostgreSQL with Drizzle schema migrations
- **Static Serving**: Express serves built frontend assets in production

### Configuration Management
- **Database Configuration**: Drizzle config with PostgreSQL dialect
- **Build Scripts**: Separate development and production commands
- **Type Checking**: TypeScript compilation verification
- **Path Aliases**: Configured for clean imports across client and shared code