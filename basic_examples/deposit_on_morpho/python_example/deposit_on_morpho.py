
from compass_api_sdk import CompassAPI, models
from dotenv import load_dotenv
import os
from web3 import Web3, HTTPProvider
load_dotenv()
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")
SPECIFIC_MORPHO_VAULT = os.getenv("SPECIFIC_MORPHO_VAULT")
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
w3 = Web3(HTTPProvider(BASE_RPC_URL))
compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

# Helper function:
def send_tx(response):
    tx = response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction).hex()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    # convert receipt to a serializable dict
    return tx_hash, dict(receipt)



# SET ALLOWANCE

response = compass.universal.allowance_set(token=models.TokenEnum.USDC, contract=SPECIFIC_MORPHO_VAULT, amount=1, chain=models.Chain.BASE_MAINNET, sender=WALLET_ADDRESS)



# SEND ALLOWANCE TRANSACTION



print(send_tx(response))



# DEPOSIT ON MORPHO



res = compass.morpho.deposit(vault_address=SPECIFIC_MORPHO_VAULT, amount=1, chain=models.MorphoDepositRequestChain.BASE_MAINNET, sender=WALLET_ADDRESS)
print(res.model_dump())

#    Handle response
print(res)


# SEND DEPOSIT TRANSACTION



print(send_tx(res))


