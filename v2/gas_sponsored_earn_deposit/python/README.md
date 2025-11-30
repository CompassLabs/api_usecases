# Gas-Sponsored Earn Deposit - Python Example

This example demonstrates how to deposit into a Morpho vault with gas sponsorship using the Compass API Python SDK.

## Prerequisites

- Python 3.8+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))
- An existing Earn Account with sufficient USDC balance
- Two wallet addresses:
  - `owner`: The wallet that owns the Earn Account (signs the EIP-712 typed data)
  - `sender`: The wallet that pays for gas (signs and broadcasts the transaction)

## Setup

1. Install dependencies:
```bash
pip install -e .
```

Or install manually:
```bash
pip install compass-api-sdk python-dotenv web3 eth-account
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Fill in your `.env` file with your actual values:
   - `COMPASS_API_KEY`: Your Compass API key
   - `WALLET_ADDRESS`: Your wallet address (owner of the Earn Account)
   - `OWNER_PRIVATE_KEY`: Owner's private key (to sign EIP-712 typed data)
   - `SENDER_PRIVATE_KEY`: Sender's private key (to sign and broadcast the transaction)
   - `BASE_RPC_URL`: Your Base mainnet RPC URL

## Run

```bash
python main.py
```

## What This Does

This example demonstrates the 3-step gas sponsorship flow:

1. **Get EIP-712 typed data**: Calls `/v2/earn/manage` with `gas_sponsorship: True` to get EIP-712 typed data
2. **Sign typed data**: The `owner` signs the EIP-712 typed data off-chain (no gas required)
3. **Prepare and execute**: Calls `/v2/gas_sponsorship/prepare` with the signature, then the `sender` signs and broadcasts the transaction (sender pays gas)

## Notes

- This example deposits 0.5 USDC into the Steakhouse USDC vault on Morpho (`0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183`)
- The `owner` must be the address that owns the Earn Account
- The `sender` can be any address that has ETH on Base to pay for gas
- The `owner` and `sender` can be the same address, but they serve different roles in the flow
- Make sure your Earn Account has sufficient USDC balance
- Make sure the `sender` wallet has enough ETH on Base to cover gas fees
- **Important**: Make sure you're using `compass-api-sdk` version 2.0.1 or later

