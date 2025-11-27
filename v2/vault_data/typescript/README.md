# Vault Data - TypeScript Example

Fetch the top 3 vaults on Base ordered by one-month CAGR (net) using the Compass API TypeScript SDK.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Compass API key.

## Run

```bash
npm run dev
```

The script prints the vault name, protocol, and one-month CAGR net percentage for the first three vaults with that metric available.
