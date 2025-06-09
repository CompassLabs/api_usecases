# Aave Looping TypeScript Example

This example demonstrates how to use the Compass Labs API SDK to perform Aave looping operations on Ethereum mainnet.

## Prerequisites

- Node.js installed
- A private key for an Ethereum wallet with sufficient funds
- An RPC URL for Ethereum mainnet (e.g., from Infura, Alchemy)
- A Compass Labs API key

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
COMPASS_API_KEY=your_compass_api_key_here
```

Make sure your private key is prefixed with "0x".

## Running the Example

Execute the TypeScript example:

```bash
npm start
```

## What the Example Does

This example:
1. Initializes the Compass Labs SDK
2. Sets up authorization for transaction batching
3. Creates an Aave looping transaction that:
   - Uses USDC as collateral
   - Borrows WETH
   - Sets an initial collateral amount of 5 USDC
   - Uses a multiplier of 1.5x
   - Sets max slippage to 2.5%
   - Sets a loan-to-value ratio of 70%

## Security Note

Never commit your `.env` file or expose your private key. Make sure to add `.env` to your `.gitignore` file. 