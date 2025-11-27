# Earn Vault Ranker - Python Example

This example demonstrates how to get the top 3 vaults sorted by 30d Net APY (after fees) using the Compass API Python SDK.

## Prerequisites

- Python 3.9+ installed
- A Compass API key ([Get one here](https://auth-compasslabs-ai.auth.eu-west-2.amazoncognito.com/login?client_id=2l366l2b3dok7k71nbnu8r1u36&redirect_uri=https://api.compasslabs.ai/auth/callback&response_type=code&scope=openid+email+profile))

## Setup

1. Install dependencies (make sure you have the latest version):
```bash
pip install --upgrade compass-api-sdk python-dotenv
```

Or if using `uv`:
```bash
uv pip install compass-api-sdk python-dotenv
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Fill in your `.env` file with your actual values:
   - `COMPASS_API_KEY`: Your Compass API key

## Run

```bash
python main.py
```

## What This Does

This example fetches the top 3 vaults sorted by 30d Net APY (after fees) from highest to lowest. For each vault, it displays:

- **Protocol name** & **Vault address**
- **30d Net APY (after fees)** - `one_month_cagr_net`
- **3m Net APY (after fees)** - `three_months_cagr_net`
- **3m Sharpe Ratio** - `three_months_sharpe_net`
- **Denomination** - The underlying token (e.g., USDC, ETH)
- **TVL** - Total Value Locked (if available) - `current_nav`

The example uses the `/v2/earn/vaults` endpoint with `order_by="one_month_cagr_net"` and `direction="desc"` to get the highest performing vaults by 30-day net APY.
