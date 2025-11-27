# Earn Vault Data - TypeScript Example

This example demonstrates how to get the top vault sorted by 30-day net annualized APY (after fees) using the Compass API TypeScript SDK.

## Prerequisites

- Node.js 18+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your API key:
```
COMPASS_API_KEY=your_api_key_here
```

## Run

```bash
npx tsx src/index.ts
```

Or build and run:
```bash
npm run build
npm start
```

## What This Does

This example fetches the top vault sorted by 30-day net annualized APY (after fees) from the `/v2/earn/vaults` endpoint. It displays the vault name and its 30-day annualized return percentage.

The example uses `orderBy="one_month_cagr_net"` and `direction="desc"` to get vault with highest 30-day net annualized return.

## Endpoint Overview

The `/v2/earn/vaults` endpoint provides access to all available Earn vaults with comprehensive metrics. You can:

- **Sort by different metrics**: `lifetime_return`, `one_month_cagr_net`, `three_months_cagr_net`, `three_months_sharpe_net`, `current_nav` 
- **Filter by chain**: `ethereum`, `base`, `arbitrum`
- **Paginate results**: Use `offset` and `limit` to fetch multiple vaults
