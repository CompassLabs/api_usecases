# Create Earn Account - TypeScript Example

This example demonstrates how to create an Earn Account using the Compass API TypeScript SDK.

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
   - `WALLET_ADDRESS`: Your wallet address (will own the Earn Account)

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

This example gets an unsigned transaction to create an Earn Account on Base. The transaction must be signed and broadcast separately.

## Notes

- **No Gas Sponsorship**: The `owner` (who controls the account) is also the `sender` (who pays for gas). Note that Earn Account creation can also be done WITH gas sponsorship (using the `/gas_sponsorship/prepare` endpoint), but this example does not use gas sponsorship.
- The Earn Account address is deterministic and returned before the transaction is confirmed.
- This example only retrieves the unsigned transaction. You'll need to sign and broadcast it separately.

