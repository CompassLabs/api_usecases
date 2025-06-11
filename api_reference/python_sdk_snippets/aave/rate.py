from compass_api_sdk import CompassAPI, models

from dotenv import

with CompassAPI(
    api_key_auth=os.env.
) as compass_api:
    res = compass_api.aave_v3.rate(
        chain=models.AaveRateChain.ARBITRUM_MAINNET, token=models.AaveRateToken.USDC
    )

    # Handle response
    print(res)
