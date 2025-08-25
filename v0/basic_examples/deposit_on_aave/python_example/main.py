# SNIPPET START 1

from compass_api_sdk import CompassAPI, models
from dotenv import load_dotenv
import os
from web3 import Web3, HTTPProvider

load_dotenv()
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
assert COMPASS_API_KEY, "Compass API requires an API key. You can sign up for free"
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
assert PRIVATE_KEY
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")
assert WALLET_ADDRESS
SPECIFIC_MORPHO_VAULT = (
    "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738"  # Seamless USDC vault
)
BASE_RPC_URL = os.getenv("BASE_RPC_URL", "https://base-rpc.publicnode.com")


w3 = Web3(HTTPProvider(BASE_RPC_URL))
compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

# SNIPPET END 1


# SNIPPET START 2
# Helper function to sign and broadcast unsigned transaction:
def send_tx(response):
    tx = response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx["transaction"], PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction).hex()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    # convert receipt to a serializable dict
    return tx_hash, dict(receipt)


# SNIPPET END 2


# SNIPPET START 3
# SET ALLOWANCE
# Get unsigned Allowance Transaction from the Compass API
response = compass.universal.generic_allowance_set(
    token=models.TokenEnum.USDC,
    contract=SPECIFIC_MORPHO_VAULT,
    amount=0.001,
    chain=models.SetAllowanceRequestChain.BASE,
    sender=WALLET_ADDRESS,
)
# SNIPPET END 3


# SNIPPET START 4
# Sign and broadcast allowance transaction
print(send_tx(response))
# SNIPPET END 4


# SNIPPET START 5
# DEPOSIT ON MORPHO
# Get unsigned transaction
res = compass.morpho.morpho_deposit(
    vault_address=SPECIFIC_MORPHO_VAULT,
    amount=0.001,
    chain=models.MorphoDepositRequestChain.BASE,
    sender=WALLET_ADDRESS,
)
print(res.model_dump())

# SNIPPET START 6
# Sign and broadcast deposit transaction
print(send_tx(res))
# SNIPPET END 6
