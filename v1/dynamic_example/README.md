# Dynamic Example - Next.js Wallet Integration

This is a Next.js TypeScript web application demonstrating Dynamic SDK integration for wallet connection and embedded wallets.

## Features

- **Dynamic SDK Integration** for seamless wallet connections
- **MetaMask Support** with secure authentication
- **WalletConnect Integration** for mobile wallet support
- **Embedded Wallets** with MPC-based security
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for responsive styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Dynamic account and environment ID

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Dynamic environment ID
```

### Environment Variables

Create a `.env.local` file with your Dynamic environment ID:

```bash
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_environment_id_here
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The development server will start at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                 # App Router (Next.js 15)
│   ├── globals.css     # Global styles with Tailwind
│   ├── layout.tsx      # Root layout with Dynamic provider
│   └── page.tsx        # Main page with wallet components
├── components/          # Wallet-related components
│   ├── WalletConnect.tsx # Wallet connection component
│   └── EmbeddedWallet.tsx # Embedded wallet management
└── lib/                # Utility functions (empty for now)
```

## Dynamic SDK Features

### Wallet Connection
- Connect MetaMask wallets
- Support for WalletConnect
- Coinbase Wallet integration
- Secure authentication flow

### Embedded Wallets
- Automatic wallet creation
- MPC-based security
- No seed phrase management
- Cross-device access

## Learn More

- [Dynamic SDK Documentation](https://www.dynamic.xyz/docs/react-sdk/quickstart)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
