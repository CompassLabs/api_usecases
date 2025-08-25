# SNIPPET START 1
from compass_api_sdk import CompassAPI
import os
import dotenv
from web3 import Web3
from eth_account import Account

dotenv.load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL")

w3 = Web3(Web3.HTTPProvider(ETHEREUM_RPC_URL))

compass_api_sdk = CompassAPI(
    api_key_auth=os.getenv("COMPASS_API_KEY"),
    server_url=os.getenv("SERVER_URL")
    or None,  # For internal testing purposes. You do not need to set this.
)

account = Account.from_key(PRIVATE_KEY)
# SNIPPET END 1


# SNIPPET START 2
auth = compass_api_sdk.transaction_bundler.transaction_bundler_authorization(
    chain="ethereum", sender=account.address
)

signed_auth = Account.sign_authorization(auth.model_dump(by_alias=True), PRIVATE_KEY)
# SNIPPET END 2

swap_tx = compass_api_sdk.swap.swap_odos(
    chain="ethereum",
    sender=account.address,
    token_in="ETH",
    token_out="USDC",
    amount=1,
    max_slippage_percent=1,
)
signed_tx = w3.eth.account.sign_transaction(
    swap_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY
)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)

# SNIPPET START 3
looping_tx = compass_api_sdk.transaction_bundler.transaction_bundler_aave_loop(
    chain="ethereum",
    sender=account.address,
    signed_authorization=signed_auth.model_dump(),
    collateral_token="USDC",
    borrow_token="WETH",
    initial_collateral_amount=100,
    multiplier=1.5,
    max_slippage_percent=2.5,
    loan_to_value=70,
)
# SNIPPET END 3

# SNIPPET START 4
signed_transaction = w3.eth.account.sign_transaction(
    looping_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY
)
tx_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 4

if receipt.status != 1:
    raise Exception()
