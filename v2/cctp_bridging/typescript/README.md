# CCTP Bridging - TypeScript Example

This example demonstrates how to bridge USDC between chains using Circle's Cross-Chain Transfer Protocol (CCTP) via the Compass API TypeScript SDK.

## Prerequisites

- Node.js 18+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))

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
   - `WALLET_ADDRESS`: Your wallet address
   - `PRIVATE_KEY`: Your wallet's private key (to sign transactions)
   - `BASE_RPC_URL`: Your Base mainnet RPC URL
   - `ARBITRUM_RPC_URL`: Your Arbitrum mainnet RPC URL

## Run

```bash
npm run dev
```

Or build and run:
```bash
npm run build
npm start
```

## What This Does

This example demonstrates the complete CCTP bridging flow:
1. **Burn** - Burns USDC on the source chain (Base) and gets a bridge ID
2. **Wait** - Polls for Circle attestation (usually takes 10-20 minutes)
3. **Mint** - Mints USDC on the destination chain (Arbitrum) once attestation is ready

## Notes

- **No Gas Sponsorship**: This example does not use gas sponsorship. The wallet pays for gas on both chains.
- Make sure your wallet has enough USDC on Base to bridge, plus ETH for gas on both Base and Arbitrum.
- The attestation wait time varies but typically takes 10-20 minutes.
- You need to have an Earn Account created on both chains before bridging (or the example will create them).
