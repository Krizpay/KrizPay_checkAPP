# KrizPay - Crypto to UPI Payment Application

KrizPay enables crypto-to-UPI payments, allowing users to pay UPI merchants using USDT cryptocurrency with real-time QR code scanning, exchange rate conversion, and MetaMask wallet integration.

## 🚀 Features

- **QR Code Scanning**: Camera-based UPI QR code scanning with fallback image upload
- **Real-time Exchange Rates**: Live USDT to INR conversion
- **MetaMask Integration**: Seamless wallet connection on Polygon network
- **Interactive Animations**: Engaging payment flow with status indicators
- **Mobile-First Design**: Optimized for mobile devices as a PWA
- **Real-time Updates**: WebSocket connections for live transaction status
- **Onmeta API Integration**: Secure crypto-to-UPI payment processing

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **WebSocket** for real-time communication
- **Zod** for validation

### Deployment
- **Vercel** for hosting
- **Neon Database** for PostgreSQL
- **PWA** capabilities with service worker

## 📱 Mobile Features

- **PWA Support**: Install as mobile app
- **Camera Access**: QR code scanning with permission handling
- **Touch Optimized**: 44px minimum touch targets
- **Responsive Design**: Mobile-first approach
- **Offline Capability**: Service worker caching

## 🚀 Deployment on Vercel

### Prerequisites
1. Vercel account
2. Neon Database account
3. Onmeta API account

### Environment Variables
Set these in your Vercel dashboard:

```bash
# Database
DATABASE_URL=your_neon_database_url

# Onmeta API
ONMETA_API_KEY=your_onmeta_api_key

# Deployment URL (auto-set by Vercel)
VERCEL_URL=your-app.vercel.app
```

### Deploy Steps

1. **Fork/Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd krizpay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your database and API credentials

4. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

   Or connect your GitHub repo to Vercel dashboard for automatic deployments.

5. **Set up database**
   ```bash
   # Push database schema
   npm run db:push
   ```

### Manual Deployment Steps

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables

2. **Build Settings**
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

3. **Environment Variables**
   Add in Vercel dashboard under Settings > Environment Variables

## 🔧 Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## 📋 API Endpoints

- `GET /api/exchange-rate/:from/:to` - Get exchange rates
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get recent transactions
- `POST /api/initiate-payment` - Initiate Onmeta payment
- `POST /api/onmeta-webhook` - Onmeta webhook handler

## 🔒 Security Features

- Environment variable protection
- CORS configuration
- Input validation with Zod
- Secure API key handling
- HTTPS enforcement in production

## 📱 PWA Installation

Users can install KrizPay as a mobile app:
1. Open in mobile browser
2. Tap "Add to Home Screen"
3. Use like a native app

## 🎨 Interactive Animations

- **Payment Flow**: Animated wallet → conversion → UPI transfer
- **Status Indicators**: Real-time progress with visual feedback
- **Success Celebration**: Confetti animation on successful payments
- **Loading States**: Engaging animations during processing

## 🐛 Troubleshooting

### Camera Issues
- Ensure HTTPS is enabled
- Grant camera permissions
- Use image upload as fallback

### Wallet Connection
- Install MetaMask browser extension
- Switch to Polygon network
- Ensure sufficient USDT balance

### Deployment Issues
- Check environment variables
- Verify database connection
- Review Vercel function logs

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For support, email hello@krizpay.com or create an issue on GitHub.