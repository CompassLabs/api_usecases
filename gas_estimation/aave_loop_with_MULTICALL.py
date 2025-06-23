import time
from time import sleep

from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
from compass_api_sdk import CompassAPI, models
from typing import cast
from eth_account import Account
import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")

w3 = Web3(HTTPProvider("http://127.0.0.1:8545"))  # ETHEREUM

# Get account
WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])

# add: ETH
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)


cast(str, COMPASS_API_KEY)

compass = CompassAPI(api_key_auth=COMPASS_API_KEY)


def print_usdc_balance() -> float:
    res = compass.token.balance(
        chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token=models.TokenEnum.USDC,
        server_url="http://0.0.0.0:80",
    )
    print(f" USDC balance: {res.amount}")
    return res.amount


def print_weth_balance() -> float:
    res = compass.token.balance(
        chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token=models.TokenEnum.WETH,
        server_url="http://0.0.0.0:80",
    )
    print(f" WETH balance: {res.amount}")
    return float(res.amount)


def print_eth_balance() -> float:
    res = compass.token.balance(
        chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token="ETH",
        server_url="http://0.0.0.0:80",
    )
    print(f" ETH balance: {res.amount}")
    return float(res.amount)


def wrap_eth_tx() -> dict:
    res = compass.universal.wrap_eth(
        amount=1,
        chain="ethereum:mainnet",
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction


def uniswap_buy_tx() -> dict:
    res = compass.uniswap_v3.swap_buy_exactly(
        token_in=models.TokenEnum.WETH,
        token_out=models.TokenEnum.USDC,
        fee=models.FeeEnum.ZERO_DOT_01,
        max_slippage_percent=0.5,
        amount=1000,
        wrap_eth=True,
        chain="ethereum:mainnet",
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction


print("WRAPPING ETH")
print(w3.eth.send_transaction(wrap_eth_tx()).hex())
time.sleep(4)

print("BUYING USDC")
print(w3.eth.send_transaction(uniswap_buy_tx()).hex())

time.sleep(4)
print_usdc_balance()
print_weth_balance()
e0 = print_eth_balance()


# First get the authorization
account = Account.from_key(PRIVATE_KEY)

auth = compass.transaction_bundler.bundler_authorization(
    chain=models.Chain.ETHEREUM_MAINNET, sender=account.address
)

auth_dict = auth.model_dump(mode="json", by_alias=True)

# Sign the authorization
signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

chain = models.Chain.ETHEREUM_MAINNET
sender = account.address
signed_authorization = signed_auth.model_dump(by_alias=True)

# SNIPPET START 3
res_multicall = compass.transaction_bundler.bundler_aave_loop(
    chain=chain,
    sender=account.address,
    signed_authorization=signed_auth.model_dump(),
    collateral_token=models.TokenEnum.USDC,
    borrow_token=models.TokenEnum.WETH,
    initial_collateral_amount=10,
    multiplier=2.5,
    max_slippage_percent=2.5,
    loan_to_value=70,
    server_url="http://0.0.0.0:80",
)

print("GETTING UNSIGNED TRANSACTION 💳💳💳")
unsigned_transaction = res_multicall.model_dump(by_alias=True)
print(f"gas from unsigned tx:  {unsigned_transaction['gas']}")

print("GETTING GAS ESTIMATE ⛽️️️️⛽️⛽️")

gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
print(gas_estimate)


print("SIGNING MULTICALL TRANSACTION")
signed_transaction = w3.eth.account.sign_transaction(unsigned_transaction, PRIVATE_KEY)
print("BROADCASTING MULTICALL TRANSACTION")

txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
print(txn_hash.hex())


sleep(2)


print("GET USDC BALANCE AGAIN:")

# wait for anvil to mine a block for the USDC balance to update
sleep(2)
print_usdc_balance()
print_weth_balance()
e1 = print_eth_balance()

print(e1)
from decimal import Decimal

print(f"gas used: {Decimal(e0) - Decimal(e1)}")  # 0.000731731017315911 = 1.86 USD
