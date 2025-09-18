import requests
import json
from web3 import Web3
from compass_api_sdk import CompassAPI, models

import requests
PLAYGROUND_KEY = '5c951bc81da566bbd030ba8e20724063'
SENDER_WALLET='0x01E62835dd7F52173546A325294762143eE4a882'
USDC_ETHEREUM='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
USDC_ARBITRUM='0xaf88d065e77c8cc2239327c5edb3a432268e5831'
WETH_ETHEREUM = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
ETHEREUM_CHAIN_ID=1
BASE_CHAIN_ID=8453
ARBITRUM_CHAIN_ID=42161
WETH_BASE='0x4200000000000000000000000000000000000006'
ETH_BASE='0x0000000000000000000000000000000000000000'

AAVE_ON_BASE = Web3.to_checksum_address("0xA238Dd80C259a72e81d7e4664a9801593F98d1c5")
ETH_DEPOSIT_AMOUNT = int(1000000000000000000/10**18)
SENDER_SWAPSXYZ = Web3.to_checksum_address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
# const txConfig: ActionRequest = {
#   actionType: "evm-calldata-tx",
#   sender,
#   srcToken: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", // USDC on Arbitrum
#   dstToken: "0x0000000000000000000000000000000000000000", // ETH on Base
#   srcChainId: 42161, // Arbitrum Chain ID
#   dstChainId: 8453, // Base Chain ID
#   slippage: 100, // bps
#   to: aaveOnBase,
#   data: supplyTxCalldata,
#   value: ethDepositAmount,
# };
ARBITRUM_CHAIN_ID = 42161





### Get AAVE Supply transaction
with CompassAPI(
    api_key_auth='eNsMwbkCP772V674gGWda9twqjb5W7Uq3b25BRXm'
) as compass_api:
    aave_supply_tx = compass_api.aave_v3.aave_supply(
            amount=ETH_DEPOSIT_AMOUNT,
            chain=models.AaveSupplyRequestChain.ETHEREUM,
            sender=SENDER_SWAPSXYZ,
            token=models.TokenEnum.ETH
    )
    print(f"aave_supply_tx={aave_supply_tx.model_dump_json()}")



### Combine AAVE Supply with swaps.xyz swap
url = "https://api-v2.swaps.xyz/api/getAction"
headers = {"x-api-key": PLAYGROUND_KEY}

params = {
    "actionType": "evm-calldata-tx",
    "sender": SENDER_WALLET,
    "srcChainId": ARBITRUM_CHAIN_ID,
    "srcToken": USDC_ARBITRUM,
    "dstChainId": BASE_CHAIN_ID,
    "dstToken": ETH_BASE,
    "slippage": 100,
    "amount": 1,
    "swapDirection": "exact-amount-in",
    "to": aave_supply_tx.transaction.to,
    "data":aave_supply_tx.transaction.data
}

response = requests.get(url, headers=headers, params=params)

print(f"swaps.xyz response: {response.json()}")
print(f"raw transaction:", json.dumps(response.json()['tx']))