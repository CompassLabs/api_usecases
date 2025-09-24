from compass_api_sdk import CompassAPI, models


with CompassAPI(
    api_key_auth="Zp69nDSOYw9P02FiVnhZBaJkvkRcz0Pg1U7cjnhr",
) as compass_api:

    res = compass_api.aave_v3.aave_aave_supported_tokens(chain=models.V1AaveAaveSupportedTokensChain.ARBITRUM)

    # Handle response
    print(res)