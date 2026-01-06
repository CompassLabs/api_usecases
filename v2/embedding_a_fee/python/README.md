# Embedding a Fee - Python Example

This example demonstrates how to embed a fee in a deposit transaction using the Compass API Python SDK.

## Prerequisites

- Python 3.9+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))
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
   - `BASE_RPC_URL`: Your Base mainnet RPC URL (to broadcast the transaction)
   - `FEE_RECIPIENT`: The wallet address that will receive the fee

## Run

```bash
python main.py
```

## What This Does

This example demonstrates how to embed a fee in a deposit transaction:
1. Gets an unsigned transaction to deposit 0.01 tokens into a vault with a 1.5% fee embedded
2. The fee is sent to the specified recipient address (`FEE_RECIPIENT`)
3. Signs the transaction with your private key
4. Broadcasts it to the Base network
5. Waits for confirmation

**Key Points:**
- The fee can be specified as a percentage (`PERCENTAGE`) or fixed amount (`FIXED`)
- The `owner` must be the address that owns the Earn Account
- Make sure your wallet has enough ETH on Base to cover gas fees
- Gas sponsorship is disabled (`gas_sponsorship=False`)

