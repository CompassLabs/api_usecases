import requests
import json

from compass_api_sdk import CompassAPI, models

import requests
PLAYGROUND_KEY = '5c951bc81da566bbd030ba8e20724063'
SENDER_WALLET='0x01E62835dd7F52173546A325294762143eE4a882'
USDC_ETHEREUM='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
USDC_ARBITRUM='0xaf88d065e77c8cc2239327c5edb3a432268e5831'#bridged
USDC_ARBITRUM_BRIDGED='0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'
WETH_ETHEREUM = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
ETHEREUM_CHAIN_ID=1
BASE_CHAIN_ID=8453
ARBITRUM_CHAIN_ID=42161
WETH_BASE='0x4200000000000000000000000000000000000006'
SWAPSXYZ_ETHEREUM='0x1b6257CAE4192e62B629eFCa21771be3D759183D'
DEPOSIT_AMOUNT_WEI=1000000

### Get AAVE Supply transaction
with CompassAPI(
    api_key_auth='eNsMwbkCP772V674gGWda9twqjb5W7Uq3b25BRXm'
) as compass_api:
    swapx_xyz_allowance_transaction= compass_api.universal.generic_allowance_set(
        token=models.TokenEnum.USDC,
        contract=SWAPSXYZ_ETHEREUM,
        amount='1',
        chain=models.Chain.ETHEREUM,
        sender=SENDER_WALLET
    )
    aave_supply_tx = compass_api.aave_v3.aave_withdraw(
            amount=(DEPOSIT_AMOUNT_WEI/10**6)/2, # 6 decimals for USDC
            chain=models.AaveSupplyRequestChain.ARBITRUM,
            sender=SENDER_WALLET,
            token=models.TokenEnum.USDC,
            recipient='0x4103e6FAc773Cb4B085EDF776da87E8E5BeD75C9'
    )

    print(f"aave_supply_tx={aave_supply_tx.transaction.model_dump_json()}")
    print(f"swapx_xyz_allowance_transaction={swapx_xyz_allowance_transaction.transaction.model_dump_json()}")



### Combine AAVE Supply with swaps.xyz swap
url = "https://api-v2.swaps.xyz/api/getAction"
headers = {"x-api-key": PLAYGROUND_KEY}

# params = {
#     "actionType": "evm-calldata-tx",
#     "sender": SENDER_WALLET,
#     "srcChainId": ETHEREUM_CHAIN_ID,
#     "srcToken": USDC_ETHEREUM,
#     "dstChainId": 1,
#     "dstToken": WETH_ETHEREUM,
#     "slippage": 100,
#     "amount": 1,
#     "swapDirection": "exact-amount-in",
#     "to": aave_supply_tx.transaction.to,
#     "data":aave_supply_tx.transaction.data
# }
params = {
    "actionType": "evm-calldata-tx",
    "sender": SENDER_WALLET,
    "srcChainId": ETHEREUM_CHAIN_ID,
    "srcToken": USDC_ETHEREUM,
    "dstChainId": ARBITRUM_CHAIN_ID,
    "dstToken": USDC_ARBITRUM,
    "slippage": 100,
    # "amount": 1000000,
    "erc20Amount": 1000000,
    "swapDirection": "exact-amount-in",
    "to": aave_supply_tx.transaction.to,
    "data":aave_supply_tx.transaction.data
}

response = requests.get(url, headers=headers, params=params)

print(f"swaps.xyz response: {response.json()}")
print(f"raw transaction:\n", json.dumps(response.json()['tx']))


# Set allowance on SWAPS.xyz bridge contract
