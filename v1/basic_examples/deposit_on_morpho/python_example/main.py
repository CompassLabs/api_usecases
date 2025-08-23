# SNIPPET START 1
import time

from compass_api_sdk import CompassAPI, models
import os
import dotenv
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
import devtools

load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
assert PRIVATE_KEY
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
assert COMPASS_API_KEY
CHAIN = models.Chain.BASE
ETH = models.TokenEnum.ETH
USDC = models.TokenEnum.USDC
SPECIFIC_MORPHO_VAULT = os.getenv("SPECIFIC_MORPHO_VAULT")

w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))

compass = CompassAPI(
    api_key_auth=COMPASS_API_KEY,
    server_url=os.getenv("SERVER_URL")
    or None,  # For internal testing purposes. You do not need to set this.
)

account = Account.from_key(PRIVATE_KEY)
WALLET_ADDRESS = account.address
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
    print(f"⏱️ Time waiting for receipt: {end - start:.2f} seconds")
    # convert receipt to a serializable dict
    return tx_hash  # , dict(receipt) # <- uncomment if you need to see the tx receipt


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

allowance_tx = compass.universal.generic_allowance_set(
    chain=CHAIN,
    sender=WALLET_ADDRESS,
    contract=SPECIFIC_MORPHO_VAULT,  # seamless USDC Vault.
    amount=0.01,
    token=USDC,
)

devtools.debug(send_tx(allowance_tx))

devtools.debug(
    compass.universal.generic_allowance(
        chain=CHAIN, token=USDC, user=WALLET_ADDRESS, contract=SPECIFIC_MORPHO_VAULT
    ).amount
)


deposit_tx = compass.morpho.morpho_deposit(
    chain=CHAIN,
    sender=WALLET_ADDRESS,
    vault_address=SPECIFIC_MORPHO_VAULT,  # seamless USDC Vault.
    amount=0.01,
)
devtools.debug(send_tx(deposit_tx))
