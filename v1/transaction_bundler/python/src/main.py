# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
from eth_account import Account
import os
from web3 import Web3
import dotenv

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

auth_dict = auth.model_dump(mode="json", by_alias=True)

signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)
signed_authorization = signed_auth.model_dump(by_alias=True)
# SNIPPET END 2

swap_tx = compass_api_sdk.swap.swap_odos(
    chain="ethereum",
    sender=account.address,
    token_in="ETH",
    token_out="WETH",
    amount=1,
    max_slippage_percent=1,
)
signed_tx = w3.eth.account.sign_transaction(
    swap_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY
)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)

# SNIPPET START 3
bundler_tx = compass_api_sdk.transaction_bundler.transaction_bundler_execute(
    chain="ethereum",
    sender=account.address,
    signed_authorization=signed_authorization,
    actions=[
        models.UserOperation(
            body=models.SetAllowanceParams(
                ACTION_TYPE="SET_ALLOWANCE",
                token="WETH",
                contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
                amount=1,
            )
        ),
        models.UserOperation(
            body=models.UniswapSellExactlyParams(
                ACTION_TYPE="UNISWAP_SELL_EXACTLY",
                token_in="WETH",
                token_out="USDC",
                fee="0.01",
                max_slippage_percent=0.5,
                amount_in=1,
            )
        ),
    ],
)
# SNIPPET END 3

# SNIPPET START 4
signed_transaction = w3.eth.account.sign_transaction(
    bundler_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY
)
tx_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 4

if receipt.status != 1:
    raise Exception()
