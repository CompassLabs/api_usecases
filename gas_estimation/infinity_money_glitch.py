# why is there more USDC at the end?


import time
from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
import os
from compass_api_sdk import CompassAPI, models
from eth_account import Account

from decimal import Decimal

w3 = Web3(HTTPProvider("http://127.0.0.1:8545"))  # ETHEREUM


load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")


compass = CompassAPI(api_key_auth=COMPASS_API_KEY)
chain = models.Chain.ETHEREUM_MAINNET
interest_rate_mode = models.InterestRateMode.VARIABLE
USDC = models.TokenEnum.USDC
USDT = models.TokenEnum.USDT
MORPHO_VAULT = "0x341193ED21711472e71aECa4A942123452bd0ddA"  # Re7 USDC Core

WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)


def print_usdc_balance():
    res = compass.token.balance(
        chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token=models.TokenEnum.USDC,
        server_url="http://0.0.0.0:80",
    )
    print(f" USDC balance: {res.amount}")
    pass


def wrap_eth_tx() -> dict:
    res = compass.universal.wrap_eth(
        amount=1,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    # print(unsigned_transaction)
    print(w3.eth.send_transaction(unsigned_transaction).hex())
    return unsigned_transaction


def uniswap_buy_tx() -> dict:
    res = compass.uniswap_v3.swap_buy_exactly(
        token_in=models.TokenEnum.WETH,
        token_out=models.TokenEnum.USDC,
        fee=models.FeeEnum.ZERO_DOT_01,
        max_slippage_percent=0.5,
        amount=2,
        wrap_eth=True,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    # print(unsigned_transaction)
    print(w3.eth.send_transaction(unsigned_transaction).hex())
    return unsigned_transaction


request_list = [
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDC,
            contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
            amount="10",
            chain=chain,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDT,
            contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
            amount="10",
            chain=chain,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDC,
            contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
            amount="10",
            chain=chain,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDT,
            contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
            amount="10",
            chain=chain,
            sender=WALLET,
        ),
    ),
    (
        compass.aave_v3.supply,
        models.AaveSupplyRequest(token=USDC, amount="2", chain=chain, sender=WALLET),
    ),
    (
        compass.aave_v3.borrow,
        models.AaveBorrowRequest(
            token=USDT,
            amount="1",
            chain=chain,
            sender=WALLET,
            interest_rate_mode=interest_rate_mode,
        ),
    ),
    (
        compass.aave_v3.repay,
        models.AaveRepayRequest(
            token=USDT,
            amount="1",
            chain=chain,
            sender=WALLET,
            interest_rate_mode=interest_rate_mode,
        ),
    ),
    (
        compass.aave_v3.withdraw,
        models.AaveWithdrawRequest(
            token=USDC, amount="2", chain=chain, sender=WALLET, recipient=WALLET
        ),
    ),
    (
        compass.uniswap_v3.swap_sell_exactly,
        models.UniswapSellExactlyRequest(
            token_in=USDC,
            token_out=USDT,
            fee=models.FeeEnum.ZERO_DOT_01,
            amount="1",
            max_slippage_percent="0.2",
            chain=chain,
            sender=WALLET,
            wrap_eth=False,
        ),
    ),
    # swapping back our USDT for USDC
    (
        compass.uniswap_v3.swap_sell_exactly,
        models.UniswapSellExactlyRequest(
            token_in=USDT,
            token_out=USDC,
            fee=models.FeeEnum.ZERO_DOT_01,
            amount="1",
            max_slippage_percent="0.2",
            chain=chain,
            sender=WALLET,
            wrap_eth=False,
        ),
    ),
]


def process_sequential():
    iteration = 0
    for function, request in request_list:
        d = request.model_dump()
        if "ACTION_TYPE" in d:
            del d["ACTION_TYPE"]
        d["server_url"] = "http://0.0.0.0:80"

        tx = function(**d)
        unsigned_transaction = tx.model_dump(by_alias=True)
        gas_estimate = w3.eth.estimate_gas(unsigned_transaction)

        tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
        w3.eth.wait_for_transaction_receipt(tx_hash)
        # time.sleep(4)
        trace = w3.provider.make_request("debug_traceCall", [tx, "latest", {}])
        total_gas_trace_call1 = trace["result"]["gas"]
        iteration = iteration + 1
        print(
            iteration, function.__name__, gas_estimate, total_gas_trace_call1, tx_hash
        )
        time.sleep(2)  # weirdly this makes it work... repay fails without it


if __name__ == "__main__":
    print_usdc_balance()
    wrap_eth_tx()
    uniswap_buy_tx()
    time.sleep(3)
    print_usdc_balance()
    process_sequential()
    print_usdc_balance()