# Privy Example

This is a [Next.js](https://nextjs.org/) project with [Privy](https://privy.io) wallet authentication integration. The project demonstrates how to connect wallets and manage user authentication using Privy's React SDK.

## Features

- ✅ Wallet connection (MetaMask, WalletConnect, etc.)
- ✅ Embedded wallet creation for users without wallets
- ✅ User authentication and session management
- ✅ Beautiful, responsive UI with Tailwind CSS
- ✅ TypeScript support

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Set up Privy

1. Create a [Privy account](https://dashboard.privy.io) and get your App ID
2. Create a `.env.local` file in the root directory:

```bash
# .env.local
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
```

Replace `your-privy-app-id-here` with your actual Privy App ID from the [Privy Dashboard](https://dashboard.privy.io).

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

The app follows the [Privy React setup guide](https://docs.privy.io/basics/react/setup):

1. **Providers Setup** (`src/app/providers.tsx`): Wraps the app with `PrivyProvider`
2. **Layout Integration** (`src/app/layout.tsx`): Includes Providers in the root layout
3. **Wallet Connection** (`src/app/page.tsx`): Uses `usePrivy` and `useWallets` hooks for authentication

### Key Components

- **PrivyProvider**: Configured with embedded wallet creation for users without wallets
- **usePrivy Hook**: Provides authentication state, login/logout functions
- **useWallets Hook**: Manages connected wallets and wallet information
- **Ready State**: Ensures Privy is fully initialized before rendering content

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout with Providers
│   ├── page.tsx             # Main page with wallet connection
│   └── providers.tsx        # Privy provider configuration
├── components.json          # Tailwind config
└── ...config files
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **Privy** - Wallet authentication and embedded wallets
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

## Key Features Demonstrated

### Authentication Flow
- Connect with existing wallets (MetaMask, WalletConnect, etc.)
- Create embedded wallets for new users
- Secure session management
- User data persistence

### Wallet Management
- Display connected wallets
- Show wallet addresses and types
- Distinguish between embedded and external wallets

### UI/UX
- Loading states while Privy initializes
- Responsive design for mobile and desktop
- Clean, modern interface
- Error handling and feedback

## Learn More

- [Privy Documentation](https://docs.privy.io) - Complete Privy integration guide
- [Privy React Setup](https://docs.privy.io/basics/react/setup) - React-specific setup instructions  
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to add your environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_PRIVY_APP_ID`

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.