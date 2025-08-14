# Vault Rebalance Demo - Next.js Application

This is a vault rebalance demonstration application built with Next.js, showcasing deposit, withdrawal, and rebalancing operations.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Vault Management** - Deposit, withdraw, and rebalance assets
- **Real-time Updates** - Live vault balance monitoring
- **Quick Presets** - Predefined rebalancing strategies
- **Transaction Tracking** - Monitor operation status and history
- **Next.js 14** with App Router
- **TypeScript** support
- **Tailwind CSS** for styling
- **ESLint** for code quality
- Modern React patterns with hooks

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main vault dashboard
│   └── api/             # API routes
│       └── hello/       # Example API endpoint
├── components/           # React components
│   ├── Header.tsx       # Navigation header
│   ├── VaultOverview.tsx # Vault balance display
│   ├── DepositForm.tsx  # Asset deposit form
│   ├── WithdrawalForm.tsx # Asset withdrawal form
│   └── RebalanceForm.tsx # Portfolio rebalancing form
└── lib/                 # Utility functions (to be added)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Compass API Integration

This demo is designed to work with the Compass API SDK. To integrate:

1. Install the Compass API SDK:
   ```bash
   npm install @compass-labs/sdk
   ```

2. Configure your API credentials in environment variables
3. Update the TODO comments in components to use actual API calls
4. Replace mock data with real vault information

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js. 