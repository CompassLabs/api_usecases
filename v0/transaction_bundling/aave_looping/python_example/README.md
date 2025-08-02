# Aave Looping Example

This Python project demonstrates how to perform Aave looping using the Compass Labs API SDK.

## Requirements

- Python 3.11+

## Dependencies

- web3
- python-dotenv
- compass-api-sdk

## Setup

1. Install dependencies:
```bash
uv sync
```

2. Create a `.env` file with your configuration:
```bash
COMPASS_API_KEY=your_api_key
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
```

3. Run the example:
```bash
poetry run python src/main.py
``` 