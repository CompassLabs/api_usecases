import os
from compass_api_sdk import CompassAPI, models

print("Hello from test!")

# Load and print the API key
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
if COMPASS_API_KEY:
    print(f"API Key loaded: {COMPASS_API_KEY[:10]}...")

SERVER_URL = os.getenv("COMPASS_API_KEY")
if SERVER_URL:
    print(f"API Key loaded: {SERVER_URL[:10]}...")

    # Test Compass API - Aave Supported Tokens]
    
compass = CompassAPI(api_key_auth=COMPASS_API_KEY, server_url=SERVER_URL)

res = compass.aave_v3.aave_aave_supported_tokens(
    chain=models.V1AaveAaveSupportedTokensChain.ARBITRUM,
    server_url=SERVER_URL
)
print("API call successful!")
print(f"Found {len(res.tokens)} supported tokens")
print(res.json())


