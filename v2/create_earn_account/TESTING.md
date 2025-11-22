# Testing Guide

Test both TypeScript and Python versions before pushing.

## Prerequisites

1. Create `.env` files in both directories with your actual values:
   - `COMPASS_API_KEY`: Your Compass API key
   - `WALLET_ADDRESS`: Your wallet address (0x...)

## Test TypeScript

```bash
cd typescript

# Make sure .env file exists (copy from .env.example and fill in values)
cp .env.example .env
# Edit .env with your actual values

# Run the script
npm run dev
```

**Expected output:**
- Earn Account Address: `0x...`
- Unsigned Transaction: `{ chainId, data, from, gas, ... }`

## Test Python

```bash
cd python

# Install dependencies (if using uv or pip)
pip install compass-api-sdk python-dotenv
# OR if using uv:
# uv pip install compass-api-sdk python-dotenv

# Make sure .env file exists
cp .env.example .env
# Edit .env with your actual values

# Run the script
python main.py
```

**Expected output:**
- Earn Account Address: `0x...`
- Unsigned Transaction: `{ chainId, data, from, gas, ... }`

## Verify Results

Both scripts should:
1. ✅ Successfully connect to Compass API
2. ✅ Return an Earn Account address
3. ✅ Return an unsigned transaction object
4. ✅ No errors

If you get errors, check:
- API key is valid
- Wallet address is correct format (0x...)
- Network connection
- SDK versions are up to date

