from compass_api_sdk import CompassAPI, models


with CompassAPI(
    api_key_auth="<YOUR_API_KEY_HERE>",
) as compass_api:

    res = compass_api.aave_v3.rate(chain=models.AaveRateChain.ARBITRUM_MAINNET, token=models.AaveRateToken.USDC)

    # Handle response
    print(res)