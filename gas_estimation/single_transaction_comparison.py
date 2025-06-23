# In this script we will compare the gas estimation of  a single set allowance transaction with and without multicall:

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


#print("WRAPPING ETH")
#print(w3.eth.send_transaction(wrap_eth_tx()).hex())
time.sleep(4)


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

res_multicall = compass.transaction_bundler.bundler_execute(
    chain=chain,
    sender=sender,
    signed_authorization=signed_authorization,
    actions=[
        # Set Allowance
        models.UserOperation(
            body=models.SetAllowanceParams(
                ACTION_TYPE="SET_ALLOWANCE",
                token=models.TokenEnum.WETH,
                contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
                amount="0.0001",
            )
        ),
        # Swap WETH for USDC on Uniswap
        # models.UserOperation(
        #     body=models.UniswapBuyExactlyParams(
        #         ACTION_TYPE="UNISWAP_BUY_EXACTLY",
        #         token_in=models.TokenEnum.WETH,
        #         token_out=models.TokenEnum.USDC,
        #         fee=models.FeeEnum.ZERO_DOT_01,
        #         max_slippage_percent=0.5,
        #         amount=1,
        #         wrap_eth=True,
        #     )
        # ),
    ],
    server_url="http://0.0.0.0:80",
)


print("GETTING UNSIGNED TRANSACTION 💳💳💳")
unsigned_transaction = res_multicall.model_dump(by_alias=True)
print(f"⛽️gas from unsigned multicall tx ⛽️:  {unsigned_transaction['gas']}")


print_weth_balance()

print_eth_balance()

def set_allowance_atomic():
    res = compass.universal.allowance_set(
        token=models.TokenEnum.WETH,
        contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
        amount="0.0001",
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- set allowance: weth uniswap")

# doing simple atomic transaction: 
set_allowance_atomic()