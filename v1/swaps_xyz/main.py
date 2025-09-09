import requests
import json

from compass_api_sdk import CompassAPI, models

import requests
PLAYGROUND_KEY = '5c951bc81da566bbd030ba8e20724063'
SENDER_WALLET='0x01E62835dd7F52173546A325294762143eE4a882'
USDC_ETHEREUM='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
WETH_ETHEREUM = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
BASE_CHAIN_ID=8453
WETH_BASE='0x4200000000000000000000000000000000000006'

### Get AAVE Supply transaction
with CompassAPI(
    api_key_auth='eNsMwbkCP772V674gGWda9twqjb5W7Uq3b25BRXm'
) as compass_api:
    aave_supply_tx = compass_api.aave_v3.aave_supply(
            amount=1,
            chain=models.AaveSupplyRequestChain.ETHEREUM,
            sender=SENDER_WALLET,
            token=models.TokenEnum.USDC
    )
    print(f"{aave_supply_tx=}")



### Combine AAVE Supply with swaps.xyz swap
url = "https://api-v2.swaps.xyz/api/getAction"
headers = {"x-api-key": PLAYGROUND_KEY}

params = {
    "actionType": "swap-action",
    "sender": SENDER_WALLET,
    "srcChainId": 1,
    "srcToken": USDC_ETHEREUM,
    "dstChainId": 1,
    "dstToken": WETH_ETHEREUM,
    "slippage": 100,
    "amount": 1,
    "swapDirection": "exact-amount-in"
}


response = requests.get(url, headers=headers, params=params)

print(response.json())
print(json.dumps(response.json()['tx']))