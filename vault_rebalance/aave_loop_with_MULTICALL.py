import time
from time import sleep

from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
from compass_api_sdk import CompassAPI, models
from eth_account import Account
import os
from web3 import Web3
from dotenv import load_dotenv
load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")

w3 = Web3(HTTPProvider("http://127.0.0.1:8545")) #ETHEREUM

# Get account
WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])

w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)


from compass_api_sdk import CompassAPI, models
from typing import cast

cast(str, COMPASS_API_KEY)

compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

usdc_vaults = [
    "0x341193ED21711472e71aECa4A942123452bd0ddA",  # Re7 USDC Core
    "0x4F460bb11cf958606C69A963B4A17f9DaEEea8b6",  # f(x) Protocol Re7 USDC
    "0x64964E162Aa18d32f91eA5B24a09529f811AEB8e", # Re7, USDC Prime
]




def print_usdc_balance() -> float:
    res = compass.token.balance(
            chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
            user=WALLET,
            token=models.TokenEnum.USDC,
            server_url='http://0.0.0.0:80'
        )
    print(f" USDC balance: {res.amount}")
    return res.amount


def print_weth_balance() -> float:
    res = compass.token.balance(
            chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
            user=WALLET,
            token=models.TokenEnum.WETH,
            server_url='http://0.0.0.0:80'
        )
    print(f" WETH balance: {res.amount}")
    return res.amount


def print_eth_balance() -> float:
    res = compass.token.balance(
            chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
            user=WALLET,
            token="ETH",
            server_url='http://0.0.0.0:80'
        )
    print(f" ETH balance: {res.amount}")
    return res.amount

def print_vault_position(vault: str) -> dict:
    res = compass.morpho.vault_position(
        chain=models.MorphoVaultPositionChain.ETHEREUM_MAINNET,
        user_address="0xa829B388A3DF7f581cE957a95edbe419dd146d1B",
        vault_address=vault,
        server_url='http://0.0.0.0:80'
    )
    # Handle response
    print(f"vault contains: {res.token_amount} USDC")
    pass

def withdraw_tx(vault: str) -> dict:
    res = compass.morpho.withdraw(
        vault_address=vault,
        amount='ALL',
        chain=models.MorphoWithdrawRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80'
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction


def set_allowance_tx(vault: str) -> dict:
    res = compass.morpho.allowance(
        vault_address=vault,
        amount=1000,
        chain=models.MorphoSetVaultAllowanceRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction

def deposit_tx(vault: str, amount: float) -> dict:
    res = compass.morpho.deposit(
        vault_address=vault,#'0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1',
        amount=amount,
        chain=models.MorphoDepositRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80'
    )

    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction

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

print('WITHDRAWING ALL USDC FROM MORPHO...')



################################################################################################################################################### START =>




PRIVATE_KEY = os.getenv("PRIVATE_KEY")

# First get the authorization
account = Account.from_key(PRIVATE_KEY)

auth = compass.transaction_bundler.bundler_authorization(chain=models.Chain.ETHEREUM_MAINNET, sender=account.address)

auth_dict = auth.model_dump(mode="json", by_alias=True)

# Sign the authorization
signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

chain = models.Chain.ETHEREUM_MAINNET
sender = account.address
signed_authorization = signed_auth.model_dump(by_alias=True)

# SNIPPET START 3
res = compass.transaction_bundler.bundler_aave_loop(
    chain=chain,
    sender=account.address,
    signed_authorization=signed_auth.model_dump(),
    collateral_token=models.TokenEnum.USDC,
    borrow_token=models.TokenEnum.WETH,
    initial_collateral_amount=10,
    multiplier=2.5,
    max_slippage_percent=2.5,
    loan_to_value=70,
    server_url="http://0.0.0.0:80"
)
# res = compass.transaction_batching.execute(
#     chain=chain,
#     sender=sender,
#     signed_authorization=signed_authorization,
#     actions=[
#         # Set Allowance
#         models.UserOperation(
#             body=models.IncreaseAllowanceParams(
#                 ACTION_TYPE="ALLOWANCE_INCREASE",
#                 token=models.TokenEnum.USDC,
#                 contract_name=models.IncreaseAllowanceParamsContractName.UNISWAP_V3_ROUTER,
#                 amount="700",
#             )
#         ),
#         # Swap WETH for USDC on Uniswap
#         models.UserOperation(
#             body=models.UniswapBuyExactlyParams(
#                 ACTION_TYPE="UNISWAP_BUY_EXACTLY",
#                 token_in=models.TokenEnum.WETH,
#                 token_out=models.TokenEnum.USDC,
#                 fee=models.FeeEnum.ZERO_DOT_01,
#                 max_slippage_percent=0.5,
#                 amount=700,
#                 wrap_eth=True,
#             )
#         ),
#     ],
#     server_url="http://0.0.0.0:80"
# )


unsigned_transaction = res.model_dump(by_alias=True)


gas_estimate = w3.eth.estimate_gas(unsigned_transaction)



print("SIGNING MULTICALL TRANSACTION")
signed_transaction = w3.eth.account.sign_transaction(unsigned_transaction, PRIVATE_KEY)
print("BROADCASTING MULTICALL TRANSACTION")

txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
print(txn_hash.hex())








# print(w3.eth.send_transaction(withdraw_tx(usdc_vaults[0])).hex())
# sleep(2)
# print(w3.eth.send_transaction(withdraw_tx(usdc_vaults[1])).hex())
# sleep(2)
# print(w3.eth.send_transaction(withdraw_tx(usdc_vaults[2])).hex())
# sleep(2)



sleep(2)



print('GET USDC BALANCE AGAIN:')

# wait for anvil to mine a block for the USDC balance to update
sleep(2)
print_usdc_balance()
print_weth_balance()
e1 = print_eth_balance()

print(e1)
from decimal import Decimal
print(f"gas used: {Decimal(e0)-Decimal(e1)}") # 0.000731731017315911 = 1.86 USD

print('SET ALLOWANCE ON MORPHO:')


# wait for anvil to mine a block for the USDC balance to update
sleep(2)








