import time
from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
import os
from compass_api_sdk import CompassAPI, models
from eth_account import Account
from rich.console import Console

w3 = Web3(HTTPProvider("http://127.0.0.1:8545"))  # ETHEREUM
CHAIN = models.Chain.ETHEREUM_MAINNET

load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")


compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

USDC = models.TokenEnum.USDC

WALLET = "0xebba555178005Aae650bd32B7B27FBE2cfEe743d"  # DANGER... MAKE A NEW ACCOUNT FROM SCRATCH WITH NEW METAMASK

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)
w3.provider.make_request(RPCEndpoint("evm_setAutomine"), True)


def print_allowances():
    portfolio = [
        compass.universal.allowance(
            chain=CHAIN,
            user=WALLET,
            token=token,
            contract=models.GenericAllowanceContractEnum.AAVE_V3_POOL,
            server_url="http://0.0.0.0:80",
        )
        for token in ["USDT", USDC, "WETH"]
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
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    # print(unsigned_transaction)
    # print(w3.eth.send_transaction(unsigned_transaction).hex())
    txn_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    # print(f"wait_for_wrap_eth: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
    return txn_hash


# unsigned_transaction = res.model_dump(by_alias=True)
# signed_transaction = w3.eth.account.sign_transaction(unsigned_transaction, PRIVATE_KEY)
# txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
w3.provider.make_request(RPCEndpoint("evm_mine"), [])

# w3.eth.wait_for_transaction_receipt(txn_hash)
w3.provider.make_request(RPCEndpoint("evm_mine"), [])


# time.sleep(10)
# print(txn_hash.hex())
# print_portfolio()
# print_allowances()

w3.provider.make_request(RPCEndpoint("evm_mine"), [])

set_allowance_tx()
w3.provider.make_request(RPCEndpoint("evm_mine"), [])

# w3.eth.wait_for_transaction_receipt(txn_hash)


# print(sender)
res = compass.universal.allowance(
    chain=models.GenericAllowanceChain.ETHEREUM_MAINNET,
    user=WALLET,
    token=models.TokenEnum.USDC,
    contract=models.GenericAllowanceContractEnum.AAVE_V3_POOL,
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
        for token in ["USDT", USDC, "WETH"]
    ]
    print(
        f"""🔐 Allowances:
          • USDT: {portfolio[0].amount}
          • USDC: {portfolio[1].amount}
          • WETH:  {portfolio[2].amount}"""
    )


# Handle response
print(res)
print_allowances()
