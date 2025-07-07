import time
from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
import os
from compass_api_sdk import CompassAPI, models
from eth_account import Account
from rich.console import Console

console = Console()

w3 = Web3(HTTPProvider("http://127.0.0.1:8545"))  # ETHEREUM
CHAIN = models.Chain.ETHEREUM_MAINNET


load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")


compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

interest_rate_mode = models.InterestRateMode.VARIABLE
USDC = models.TokenEnum.USDC
WETH = models.TokenEnum.WETH
USDT = models.TokenEnum.USDT

WALLET = "0xebba555178005Aae650bd32B7B27FBE2cfEe743d"  # DANGER... MAKE A NEW ACCOUNT FROM SCRATCH WITH NEW METAMASK


w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)
w3.provider.make_request(RPCEndpoint("evm_setAutomine"), True)


print(CHAIN)


def print_portfolio():
    portfolio = [
        compass.token.balance(
            chain=CHAIN,
            user=WALLET,
            token=token,
            server_url="http://0.0.0.0:80",
        )
        for token in [USDT, USDC, "ETH", WETH]
    ]
    print(
        f"""📊 Portfolio:
          • USDT: {portfolio[0].amount}
          • USDC: {portfolio[1].amount}
          • ETH:  {portfolio[2].amount}
          • WETH:  {portfolio[3].amount}"""
    )


def print_allowances():
    portfolio = [
        compass.universal.allowance(
            chain=CHAIN,
            user=WALLET,
            token=token,
            contract=models.GenericAllowanceContractEnum.AAVE_V3_POOL,
            server_url="http://0.0.0.0:80",
        )
        for token in [USDT, USDC, WETH]
    ]
    print(
        f"""🔐 Allowances:
          • USDT: {portfolio[0].amount}
          • USDC: {portfolio[1].amount}
          • WETH:  {portfolio[2].amount}"""
    )


def wrap_eth_tx():
    res = compass.universal.wrap_eth(
        amount=10,
        chain=CHAIN,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    # print(unsigned_transaction)
    # print(w3.eth.send_transaction(unsigned_transaction).hex())
    tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    # print(f"wait_for_wrap_eth: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
    pass


def uniswap_buy_USDC_tx():
    res = compass.uniswap_v3.swap_buy_exactly(
        token_in=models.TokenEnum.WETH,
        token_out=models.TokenEnum.USDC,
        fee=FEE,
        max_slippage_percent=0.5,
        amount=2,
        wrap_eth=True,
        chain=CHAIN,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    # print(unsigned_transaction)
    # print(w3.eth.send_transaction(unsigned_transaction).hex())
    tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    # print(f"wait_for buy_usdc: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
    pass


def set_allowance_tx():
    print("settting allowance")
    res = compass.universal.allowance_set(
        contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
        token=models.TokenEnum.USDC,
        chain=models.Chain.ETHEREUM_MAINNET,
        amount="10000",
        sender=sender,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    # print(unsigned_transaction)
    # print(w3.eth.send_transaction(unsigned_transaction).hex())
    txn_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    # print(f"wait_for_wrap_eth: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
    return txn_hash


print_allowances()
# print_aave_metrics()
print_portfolio()
wrap_eth_tx()
# time.sleep(2)
uniswap_buy_USDC_tx()

# uniswap_buy_USDT_tx()
# time.sleep(3)
# print_portfolio()


# Multicall Stuff


# #######################################
# # First get the authorization
# account = Account.from_key(PRIVATE_KEY)
#
#
# auth = compass.transaction_bundler.bundler_authorization(
#     chain=models.Chain.ETHEREUM_MAINNET, sender=account.address
# )
#
# auth_dict = auth.model_dump(mode="json", by_alias=True)
#
# # Sign the authorization
# signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)
#
# chain = models.Chain.ETHEREUM_MAINNET
# sender = account.address
# signed_authorization = signed_auth.model_dump(by_alias=True)
# #######################################


# First get the authorization
account = Account.from_key(PRIVATE_KEY)

auth = compass.transaction_bundler.bundler_authorization(
    chain=CHAIN, sender=account.address
)

auth_dict = auth.model_dump(mode="json", by_alias=True)

# Sign the authorization
signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

sender = account.address
print(sender)
print(WALLET)


CHAIN = models.Chain.ETHEREUM_MAINNET
signed_authorization = signed_auth.model_dump(by_alias=True)


res = compass.transaction_bundler.bundler_execute(
    chain=CHAIN,
    sender=WALLET,
    signed_authorization=signed_authorization,
    actions=[
        # Set Allowance
        models.UserOperation(
            body=models.SetAllowanceParams(
                ACTION_TYPE="SET_ALLOWANCE",
                token=models.TokenEnum.USDC,
                contract=models.SetAllowanceParamsContractEnum.AAVE_V3_POOL,
                amount="777",
            )
        ),
        # Swap WETH for USDC on Uniswap
        # models.UserOperation(
        #     body=models.AaveSupplyParams(
        #         token=USDC,
        #         ACTION_TYPE="AAVE_SUPPLY",
        #         amount=1,
        #     )
        # ),
    ],
    server_url="http://0.0.0.0:80",
)
# w3.provider.make_request(RPCEndpoint("evm_mine"), [])

"""
{'chainId': 1, 
'data': '0x174dea71000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000044095ea7b300000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2000000000000000000000000000000000000000000000000000000002e50144000000000000000000000000000000000000000000000000000000000', 'from': '0xebba555178005Aae650bd32B7B27FBE2cfEe743d', 'gas': 88084, 'to': '0xebba555178005Aae650bd32B7B27FBE2cfEe743d', 'value': 0, 'nonce': 2, 'maxFeePerGas': 9534187448, 'maxPriorityFeePerGas': 1000000000, 'authorizationList': [{'nonce': 1, 'address': '0x8864833793E8186C04CD91e40bE3AFF6cfD81302', 'chainId': 1, 'r': 94817168167137298664623418644222919348508159914989571949005114850432398256806, 's': 15908141720107784052753468529814219245689140101750519433400137866853598160948, 'yParity': 0}]}

"""


unsigned_transaction = res.model_dump(by_alias=True)
print(unsigned_transaction)
signed_transaction = w3.eth.account.sign_transaction(unsigned_transaction, PRIVATE_KEY)
txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)

w3.provider.make_request(RPCEndpoint("evm_mine"), [])
receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
print("-----RECEIPT------")
print(receipt)


w3.provider.make_request(RPCEndpoint("evm_mine"), [])


# time.sleep(10)
# print(txn_hash.hex())
# print_portfolio()
# print_allowances()

w3.provider.make_request(RPCEndpoint("evm_mine"), [])

# set_allowance_tx()
w3.provider.make_request(RPCEndpoint("evm_mine"), [])

# w3.eth.wait_for_transaction_receipt(txn_hash)


# print(sender)
res = compass.universal.allowance(
    chain=models.GenericAllowanceChain.ETHEREUM_MAINNET,
    token=models.TokenEnum.USDC,
    contract=models.GenericAllowanceContractEnum.AAVE_V3_POOL,
    user=sender,
    server_url="http://0.0.0.0:80",
)

# Handle response
print(res)
print(sender, WALLET, account.address)


# check authorization or anvil.]


# anvil --no-mining --hardfork prague --host 0.0.0.0 --fork-url "https://hidden-late-putty.quiknode.pro/769c80cd4f5e8075d89db841c129e8c3fee67bd2" --port 8545 --chain-id 1 --no-rate-limit


# log the hashes
# log the gas estimations.
#
