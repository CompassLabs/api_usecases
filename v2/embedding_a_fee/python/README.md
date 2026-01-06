# Embedding a Fee - Python Example

This example demonstrates how to embed a fee in a deposit transaction using the Compass API Python SDK.

## Prerequisites

- Python 3.9+ installed
- A Compass API key ([Get one here](https://www.compasslabs.ai/login))
- An existing Earn Account with a position in a vault
- USDC balance in your wallet on Base

## Setup

1. Install dependencies:
```bash
pip install -e .
```

Or install directly:
```bash
pip install compass-api-sdk python-dotenv web3 eth-account
```

**Note:** Make sure you have `compass-api-sdk` version 2.0.1 or later.

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Fill in your `.env` file with your actual values:
   - `COMPASS_API_KEY`: Your Compass API key
   - `WALLET_ADDRESS`: Your wallet address (owner of the Earn Account)
   - `PRIVATE_KEY`: Your wallet's private key (to sign the transaction)
   - `BASE_RPC_URL`: Your Base mainnet RPC URL (to broadcast the transaction, you can use another chain too)
   - `FEE_RECIPIENT`: The wallet address that will receive the fee

## Run

```bash
python main.py
```


