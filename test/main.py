import os
from compass_api_sdk import CompassAPI, models

def main():
    print("Hello from test!")
    
    # Load and print the API key
    api_key = os.getenv("COMPASS_API_KEY")
    if api_key:
        print(f"API Key loaded: {api_key[:10]}...")
        
        # Test Compass API - Aave Supported Tokens
        try:
            with CompassAPI(
                api_key_auth=api_key,
            ) as compass_api:
                res = compass_api.aave_v3.aave_aave_supported_tokens(chain=models.V1AaveAaveSupportedTokensChain.ARBITRUM)
                print("API call successful!")
                print(f"Found {len(res.tokens)} supported tokens")
                if res.tokens:
                    print(f"First token: {res.tokens[0].symbol} - {res.tokens[0].address}")
        except Exception as e:
            print(f"API call failed: {e}")
    else:
        print("No API key found")


if __name__ == "__main__":
    main()
