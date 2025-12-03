# Gas Sponsorship - Python Example

This example demonstrates two gas sponsorship use cases using the Compass API Python SDK:

1. **Fund Earn Account with Gas Sponsorship**: Approve and transfer tokens from your wallet to your Earn Account, with gas paid by a sponsor
2. **Manage Earn Position with Gas Sponsorship**: Deposit into a Morpho vault from your Earn Account, with gas paid by a sponsor

## Prerequisites

- Python 3.8+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))
- Two wallet addresses:
  - `owner`: The wallet that owns the Earn Account (signs EIP-712 typed data off-chain)
  - `sender`: The wallet that pays for gas (signs and broadcasts transactions)

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
   - `SENDER_PRIVATE_KEY`: Sender's private key (to sign and broadcast transactions)
   - `BASE_RPC_URL`: Your Base mainnet RPC URL

## Run

```bash
python main.py
```

## What This Does

### Example 1: Fund Earn Account with Gas Sponsorship

This demonstrates the 4-step flow to fund an Earn Account with gas sponsorship:

1. **Get EIP-712 typed data**: Calls `/v2/gas_sponsorship/approve_transfer` with `gas_sponsorship: True` to get Permit2 approval typed data
2. **Sign typed data**: The `owner` signs the EIP-712 typed data off-chain (no gas required)
3. **Prepare transaction**: Calls `/v2/gas_sponsorship/prepare` with the signature to get the approval transaction
4. **Execute**: The `sender` signs and broadcasts the transaction (sender pays gas)

After this, the Earn Account can be funded using `/v2/earn/transfer` with gas sponsorship enabled.

### Example 2: Manage Earn Position with Gas Sponsorship

This demonstrates the 4-step flow to deposit into a vault with gas sponsorship:

1. **Get EIP-712 typed data**: Calls `/v2/earn/manage` with `gas_sponsorship: True` to get deposit typed data
2. **Sign typed data**: The `owner` signs the EIP-712 typed data off-chain (no gas required)
3. **Prepare transaction**: Calls `/v2/gas_sponsorship/prepare` with the signature to get the deposit transaction
4. **Execute**: The `sender` signs and broadcasts the transaction (sender pays gas)

## Notes

- The `owner` must be the address that owns the Earn Account
- The `sender` can be any address that has ETH on Base to pay for gas
- The `owner` and `sender` can be the same address, but they serve different roles in the flow
- Example 2 deposits 0.5 USDC into the Steakhouse USDC vault on Morpho (`0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183`)
- Make sure your Earn Account has sufficient USDC balance for deposits
- Make sure the `sender` wallet has enough ETH on Base to cover gas fees
- **Important**: Make sure you're using `compass-api-sdk` version 2.0.1 or later

## Known Issues

**Example 2 (Manage Earn Position) - Signature Validation Error:**

There is a known issue with the Python SDK's EIP-712 structure handling for `BatchedSafeOperationsResponse` (SafeTx). When calling `/v2/gas_sponsorship/prepare` with EIP-712 data from `/v2/earn/manage`, the signature validation may fail with "Invalid signature" error.

**Workaround:**
- The TypeScript version works correctly. Please use the TypeScript example for managing Earn positions with gas sponsorship.
- Example 1 (Fund Earn Account) works correctly in Python.

**Root Cause:**
The Python SDK requires a dict format for EIP-712 data, but there's a structure mismatch between what we sign (for `eth_account` compatibility) and what the backend validates. The TypeScript SDK handles this correctly by passing the model object directly.

**Status:**
This is a known limitation. Please contact the API team about Python SDK's EIP-712 serialization for `BatchedSafeOperationsResponse`.

