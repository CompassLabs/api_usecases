# Deposit into Pendle Fixed Yield Position - TypeScript Example

This example demonstrates how to deposit into a Pendle Principal Token (PT) fixed yield position using the Compass API TypeScript SDK.

## Prerequisites

- Node.js 16+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))
- An existing Earn Account
- USDC balance in your Earn Account on Base

## Setup

1. Install dependencies:
```bash
npm install
```

**Note:** PENDLE_PT venue type support requires `@compass-labs/api-sdk` version 2.1.35 or later.

2. Fill in your environment variables (or create a `.env` file):
   - `COMPASS_API_KEY`: Your Compass API key
   - `WALLET_ADDRESS`: Your wallet address (owner of the Earn Account)
   - `PRIVATE_KEY`: Your wallet's private key (to sign the transaction)
   - `BASE_RPC_URL`: Your Base mainnet RPC URL (to broadcast the transaction)

## Run

```bash
npm run dev
```

Or build and run:
```bash
npm run start
```

## What This Does

This example:
1. Gets an unsigned transaction to deposit 1 USDC into a Pendle PT fixed yield position
2. Signs the transaction with your private key
3. Broadcasts it to the Base network
4. Waits for confirmation

## What is Pendle Fixed Yield?

Pendle Principal Tokens (PT) provide fixed-rate yields by tokenizing the principal component of yield-bearing assets. When you deposit into a PT position, you lock in a known APY until the maturity date, providing predictable returns.

## Notes

- This example deposits 1 USDC into a Pendle PT position on Base
- The market address `0x9C1e33fFE5e6331879BbE58a8AfB65B632ed7867` is an example market expiring 2026-02-05 with ~13% APY
- **Important**: Pendle markets have expiry dates. If this market has expired, use the `earnPendleMarkets` endpoint to find active markets:
  ```typescript
  const markets = await compass.earn.earnPendleMarkets({
    chain: "base",
    underlyingSymbol: "USDC",
    orderBy: "tvl_usd",
    limit: 10
  });
  // Filter for active markets where market.expiry > current_timestamp
  ```
- The `owner` must be the address that owns the Earn Account
- Make sure your Earn Account has sufficient USDC balance on Base
- Make sure your wallet has enough ETH on Base to cover gas fees
- Gas sponsorship is disabled (`gasSponsorship: false`)
- The `maxSlippagePercent` parameter controls acceptable slippage (default: 1%)
- The fixed APY is locked at the time of deposit until maturity
