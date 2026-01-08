# Fund Earn Account with Gas Sponsorship (Python)

This example demonstrates how to fund an Earn Account with gas sponsorship enabled, where the owner signs transactions off-chain and a sender pays for gas.

## Overview

Gas sponsorship allows users to interact with DeFi without holding ETH for gas fees. This example covers:

1. **Step 1 (One-time):** Set up Permit2 approval for USDC transfers
2. **Step 2:** Transfer USDC from owner's wallet to Earn Account with gas sponsorship

## Prerequisites

- Python 3.8+
- Compass API key ([get one here](https://www.compasslabs.ai/dashboard))
- Two wallets:
  - **Owner wallet:** Signs transactions off-chain (doesn't need ETH)
  - **Sender wallet:** Pays gas fees (needs ETH on Base)
- USDC in owner's wallet on Base

## Installation

```bash
pip install -e .
```

Or install dependencies directly:

```bash
pip install compass-api-sdk python-dotenv web3 eth-account
```

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
COMPASS_API_KEY=your_compass_api_key_here
OWNER_ADDRESS=0xYourOwnerWalletAddress
OWNER_PRIVATE_KEY=your_owner_private_key_here
SENDER_ADDRESS=0xYourSenderWalletAddress
SENDER_PRIVATE_KEY=your_sender_private_key_here
BASE_RPC_URL=https://mainnet.base.org
```

## Usage

```bash
python main.py
```

## How It Works

### Step 1: Approve Token Transfer (One-time per token)

1. Call `/gas_sponsorship/approve_transfer` with `gas_sponsorship=true` to get EIP-712 typed data
2. Owner signs the typed data off-chain (no gas required)
3. Submit signature + typed data to `/gas_sponsorship/prepare`
4. Sender signs and broadcasts the transaction, paying gas

This sets up a Permit2 allowance and only needs to be done once per token.

### Step 2: Fund Earn Account

1. Call `/earn/transfer` with `gas_sponsorship=true` to get EIP-712 typed data
2. Owner signs the typed data off-chain (no gas required)
3. Submit signature + typed data to `/gas_sponsorship/prepare`
4. Sender signs and broadcasts the transaction, paying gas

## Key Concepts

- **Owner:** The wallet that owns the Earn Account and signs transactions off-chain
- **Sender:** The wallet that pays gas and broadcasts transactions on-chain
- **Permit2:** EIP-2612 standard that enables gasless approvals for supported tokens (like USDC)
- **EIP-712:** Typed structured data signing standard used for off-chain signatures

## Token Support

Not all tokens support gas-sponsored transfers. Tokens must support EIP-2612 permit.

**Supported:** USDC, DAI, and most modern ERC-20 tokens
**Not supported:** USDT, WETH (use standard flow with `gas_sponsorship=false`)

## Learn More

- [Gas Sponsorship Documentation](https://docs.compasslabs.ai/v2/Products/gas-sponsorship)
- [API Reference: Approve Transfer](https://docs.compasslabs.ai/v2/api-reference/gas-sponsorship/approve-token-transfer)
- [API Reference: Prepare Transaction](https://docs.compasslabs.ai/v2/api-reference/gas-sponsorship/prepare-gas-sponsored-transaction)
