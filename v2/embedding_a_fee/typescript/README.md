# Embedding a Fee - TypeScript Example

This example demonstrates how to embed a fee in a deposit transaction using the Compass API TypeScript SDK.

## Prerequisites

- Node.js 18+ installed
- A Compass API key ([Get one here](https://www.compasslabs.ai/login))
- An existing Earn Account with a position in a vault
- USDC balance in your wallet on Base

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Fill in your `.env` file with your actual values:
   - `COMPASS_API_KEY`: Your Compass API key
   - `WALLET_ADDRESS`: Your wallet address (owner of the Earn Account)
   - `PRIVATE_KEY`: Your wallet's private key (to sign the transaction)
   - `BASE_RPC_URL`: Your Base mainnet RPC URL (to broadcast the transaction)
   - `FEE_RECIPIENT`: The wallet address that will receive the fee

## Run

```bash
npm run dev
```

Or build and run:
```bash
npm run build
npm start
```


