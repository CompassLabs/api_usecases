# Fund Earn Account - Python Example

This example demonstrates how to fund an Earn Account by transferring USDC from your wallet to the Earn Account using the Compass API Python SDK.

## Prerequisites

- Python 3.8+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))
- An existing Earn Account
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

## Run

```bash
python main.py
```

## What This Does

This example:
1. Gets an unsigned transaction to transfer 2 USDC from your wallet to your Earn Account
2. Signs the transaction with your private key
3. Broadcasts it to the Base network
4. Waits for confirmation

## Notes

- This example transfers 2 USDC from your wallet to your Earn Account
- The `owner` must be the address that owns the Earn Account
- Make sure your wallet has sufficient USDC balance on Base
- Make sure your wallet has enough ETH on Base to cover gas fees
- Gas sponsorship is disabled (`gas_sponsorship=False`)

