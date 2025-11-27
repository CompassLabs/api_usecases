# Vault Data - Python Example

Fetch the top 3 vaults on Base ordered by one-month CAGR (net) using the Compass API Python SDK.

## Setup

1. Install dependencies:
   ```bash
   pip install -e .
   ```
2. Copy `.env.example` to `.env` and fill in your Compass API key.

## Run

```bash
python main.py
```

The script prints the vault name, protocol, and one-month CAGR net percentage for the first three vaults with that metric available.
