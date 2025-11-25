# Manage Earn Position - Python Example

This example demonstrates how to deposit into a Morpho vault using the Compass API Python SDK.

## Prerequisites

- Python 3.8+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))
- An existing Earn Account

## Setup

1. Install dependencies (make sure you have the latest version):
```bash
pip install --upgrade compass-api-sdk python-dotenv web3 eth-account
```

Or if using `uv`:
```bash
uv pip install compass-api-sdk python-dotenv web3 eth-account
```

**Note:** This example requires `compass-api-sdk` version 2.0.1 or later (which includes the `earn` endpoints). Make sure to upgrade if you have an older version.

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
1. Gets an unsigned transaction to deposit 1 USDC into a Morpho vault
2. Signs the transaction with your private key
3. Broadcasts it to the Base network
4. Waits for confirmation

## Notes

- This example deposits 1 USDC into the Morpho vault at `0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183`
- The `owner` must be the address that owns the Earn Account
- Make sure your Earn Account has sufficient USDC balance
- Make sure your wallet has enough ETH on Base to cover gas fees
- **Important:** Requires `compass-api-sdk` version 2.0.1 or later (includes `earn` endpoints). Make sure to install the latest version.

