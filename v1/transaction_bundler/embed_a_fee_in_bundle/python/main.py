# SNIPPET START 1
import time

from compass_api_sdk import CompassAPI, models
import os
import dotenv
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import devtools


# constants
load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
assert PRIVATE_KEY
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
assert COMPASS_API_KEY
CHAIN = models.Chain.BASE
ETH = models.TokenEnum.ETH
USDC = models.TokenEnum.USDC
SPECIFIC_MORPHO_VAULT = (
    os.getenv("SPECIFIC_MORPHO_VAULT") or "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738"
)  # Seamless USDC Vault on base: https://app.morpho.org/base/vault/0x616a4E1db48e22028f6bbf20444Cd3b8e3273738/seamless-usdc-vault
account = Account.from_key(PRIVATE_KEY)
WALLET_ADDRESS = account.address


# clients
w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
compass = CompassAPI(
    api_key_auth=COMPASS_API_KEY,
    server_url=os.getenv("SERVER_URL")
    or None,  # For internal testing purposes. You do not need to set this.
)


# SNIPPET END 1


# SNIPPET START 2
# Helper function to sign and broadcast unsigned transaction:
def send_tx(response):
    tx = response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx["transaction"], PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction).hex()
    start = time.time()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    end = time.time()
    if receipt.status != 1:
        raise Exception()
    print(f"⏱️ Time waiting for receipt: {end - start:.2f} seconds")
    # convert receipt to a serializable dict
    return tx_hash  # , dict(receipt) # <- uncomment if you need to see the tx receipt


# SNIPPET END 2

# SNIPPET START 2
auth = compass.transaction_bundler.transaction_bundler_authorization(
    chain=CHAIN, sender=WALLET_ADDRESS
)

auth_dict = auth.model_dump(mode="json", by_alias=True)

signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)
signed_authorization = signed_auth.model_dump(by_alias=True)
# SNIPPET END 2


# assuming your wallet has ETH but not USDC. We sell 0.03 USD of ETH for USDC.
one_USD_in_ETH = 1 / float(compass.token.token_price(chain=CHAIN, token=ETH).price)

# using ODOS to perform the swap
swap_tx = compass.swap.swap_odos(
    chain=CHAIN,
    sender=WALLET_ADDRESS,
    token_in=ETH,
    token_out=USDC,
    amount=0.03 * one_USD_in_ETH,  # amount in = 0.03 USD in ETH
    max_slippage_percent=1,
)

devtools.debug(send_tx(swap_tx))

time.sleep(1)


# SNIPPET START 3

DEPOSIT_AMOUNT = 0.01  # amount that your user will deposit in a morpho vault
FEE_PERCENTAGE = 0.01  # the percentage fee you will charge to the user.
FEE = DEPOSIT_AMOUNT * FEE_PERCENTAGE  # the fee you will charge to the user.
bundler_tx = compass.transaction_bundler.transaction_bundler_execute(
    chain=CHAIN,
    sender=WALLET_ADDRESS,
    signed_authorization=signed_authorization,
    actions=[
        models.UserOperation(
            body=models.SetAllowanceParams(
                ACTION_TYPE="SET_ALLOWANCE",
                token=USDC,
                contract=SPECIFIC_MORPHO_VAULT,
                amount=DEPOSIT_AMOUNT,
            )
        ),
        models.UserOperation(
            body=models.TokenTransferParams(
                to="0xb8340945eBc917D2Aa0368a5e4E79C849c461511",
                token=USDC,
                amount=FEE,
                ACTION_TYPE="TOKEN_TRANSFER",
            )
        ),
        models.UserOperation(
            body=models.MorphoDepositParams(
                vault_address=SPECIFIC_MORPHO_VAULT,
                amount=DEPOSIT_AMOUNT - FEE,
                ACTION_TYPE="MORPHO_DEPOSIT",
            )
        ),
    ],
)
# SNIPPET END 3

# SNIPPET START 4
devtools.debug(send_tx(bundler_tx))
# SNIPPET END 4

# if receipt.status != 1:
#     raise Exception()
