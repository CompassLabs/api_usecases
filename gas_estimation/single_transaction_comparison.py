import time
import devtools
from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
import os
from compass_api_sdk import CompassAPI, models
from eth_account import Account
from rich.console import Console

console = Console()
from decimal import Decimal

#w3 = Web3(HTTPProvider("http://127.0.0.1:8545"))  # ETHEREUM
w3 = Web3(HTTPProvider("http://127.0.0.1:8546"))  # BASE
#CHAIN = models.Chain.ETHEREUM_MAINNET
CHAIN = models.Chain.BASE_MAINNET
#FEE = models.FeeEnum.ZERO_DOT_01 # DOESN'T work on base for buying USDT for some reason
FEE = models.FeeEnum.ZERO_DOT_3




load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")


compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

interest_rate_mode = models.InterestRateMode.VARIABLE
USDC = models.TokenEnum.USDC
WETH = models.TokenEnum.WETH
USDT = models.TokenEnum.USDT
MORPHO_VAULT = "0x341193ED21711472e71aECa4A942123452bd0ddA"  # Re7 USDC Core

#WALLET = "0xfcbA14864649dCc37774a20933C22A27e0478Fff"
#WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"
WALLET = "0xebba555178005Aae650bd32B7B27FBE2cfEe743d" # DANGER... MAKE A NEW ACCOUNT FROM SCRATCH WITH NEW METAMASK

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)

print(CHAIN)
def print_ETH_balance():
    res = compass.token.balance(
        chain=CHAIN,
        user=WALLET,
        token="ETH",
        server_url="http://0.0.0.0:80",
    )
    print(f" ETH balance: {res.amount}")
    pass


def print_aave_metrics():
    res1 = compass.aave_v3.user_position_per_token(
        chain=CHAIN,
        user=WALLET,
        token=models.AaveUserPositionPerTokenToken.USDC,
        server_url="http://0.0.0.0:80",
    )
    res2 = compass.aave_v3.user_position_summary(
        chain=CHAIN,
        user=WALLET,
        server_url="http://0.0.0.0:80"
    )

    #print(f"💰 A Token Balance: {res1.token_balance}")
    print(f"🌈 SUMMARY 🌈: 💰 Collateral: {res2.total_collateral}, 🧾 Debt: {res2.total_debt}, 💰 A Token Balance: {res1.token_balance}, Health Factor: {res2.health_factor} ")


def print_USDC_balance():
    res = compass.token.balance(
        chain=CHAIN,
        user=WALLET,
        token=models.TokenEnum.USDC,
        server_url="http://0.0.0.0:80",
    )
    print(f" USDC balance: {res.amount}")
    pass


def print_USDT_balance():
    res = compass.token.balance(
        chain=CHAIN,
        user=WALLET,
        token=models.TokenEnum.USDT,
        server_url="http://0.0.0.0:80",
    )
    print(f" USDT balance: {res.amount}")
    pass


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
    #print(w3.eth.send_transaction(unsigned_transaction).hex())
    tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    print(f"wait_for_wrap_eth: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
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
    #print(w3.eth.send_transaction(unsigned_transaction).hex())
    tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    print(f"wait_for buy_usdc: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
    pass

def uniswap_buy_USDT_tx():
    res = compass.uniswap_v3.swap_buy_exactly(
        token_in=models.TokenEnum.WETH,
        token_out=models.TokenEnum.USDT,
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
    tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    print(f"wait_for buy_usdt: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
    pass

non_multicall_request_list = [
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDC,
            contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDT,
            contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDC,
            contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=USDT,
            contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.aave_v3.supply,
        models.AaveSupplyRequest(token=USDC, amount="2", chain=CHAIN, sender=WALLET),
    ),
    (
        compass.aave_v3.borrow,
        models.AaveBorrowRequest(
            token=USDT,
            amount="1",
            chain=CHAIN,
            sender=WALLET,
            interest_rate_mode=interest_rate_mode,
        ),
    ),
    (
        compass.aave_v3.repay,
        models.AaveRepayRequest(
            token=USDT,
            amount="1",
            chain=CHAIN,
            sender=WALLET,
            interest_rate_mode=interest_rate_mode,
        ),
    ),
    (
        compass.aave_v3.withdraw,
        models.AaveWithdrawRequest(
            token=USDC, amount="2", chain=CHAIN, sender=WALLET, recipient=WALLET
        ),
    ),
    (
        compass.uniswap_v3.swap_sell_exactly,
        models.UniswapSellExactlyRequest(
            token_in=USDC,
            token_out=USDT,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.uniswap_v3.swap_buy_exactly,
        models.UniswapSellExactlyRequest(
            token_in=USDT,
            token_out=USDC,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
]

################# MULTICALL #################


multicall_request_list = [
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=USDC,
            contract=models.SetAllowanceParamsContractEnum.AAVE_V3_POOL,
            amount="100",
        )
    ),
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=USDT,
            contract=models.SetAllowanceParamsContractEnum.AAVE_V3_POOL,
            amount="100",
        )
    ),
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=USDC,
            contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
            amount="100",
        )
    ),
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=USDT,
            contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
            amount="100",
        )
    ),
    models.UserOperation(
        body=models.AaveSupplyParams(
            token=USDC,
            amount="2",
            ACTION_TYPE="AAVE_SUPPLY",
        )
    ),
    models.UserOperation(
        body=models.AaveBorrowParams(
            token=USDT,
            amount="1",
            ACTION_TYPE="AAVE_BORROW",
            interest_rate_mode=interest_rate_mode,
        )
    ),
    models.UserOperation(
        body=models.AaveRepayParams(
            token=USDT,
            amount="1",
            ACTION_TYPE="AAVE_REPAY",
            interest_rate_mode=interest_rate_mode,
        )
    ),
    models.UserOperation(
        body=models.AaveWithdrawParams(
            token=USDC, amount="1", ACTION_TYPE="AAVE_WITHDRAW", recipient=WALLET
        )
    ),
    models.UserOperation(
        body=models.UniswapSellExactlyParams(
            token_in=USDC,
            token_out=USDT,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            ACTION_TYPE="UNISWAP_SELL_EXACTLY",
        )
    ),
    models.UserOperation(
        body=models.UniswapBuyExactlyParams(
            token_in=USDT,
            token_out=USDC,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            ACTION_TYPE="UNISWAP_BUY_EXACTLY",
        )
    ),
]


def process_sequential():
    iteration = 0
    for function, request in non_multicall_request_list:
        d = request.model_dump()
        if "ACTION_TYPE" in d:
            del d["ACTION_TYPE"]
        d["server_url"] = "http://0.0.0.0:80"

        tx = function(**d)
        print(f"tx: {tx}")
        unsigned_transaction = tx.model_dump(by_alias=True)
        gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
        #gas_estimate = 0

        print("block number before:", w3.eth.block_number)

        tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
        print("waiting for transaction receipt...")
        w3.eth.wait_for_transaction_receipt(tx_hash)
        time.sleep(0)
        print("block number after:", w3.eth.block_number)
        trace = w3.provider.make_request("debug_traceCall", [tx, "latest", {}])
        print(f"trace: {trace}")
        total_gas_trace_call1 = trace["result"]["gas"]
        iteration = iteration + 1


        #time.sleep(2)  # weirdly this makes it work... repay fails without it


        console.print(
            f"[bold cyan]COMPLETED: {iteration}[/] | [bold magenta]{function.__name__}[/] | [bold yellow]{gas_estimate}[/] | [bold green]{total_gas_trace_call1}[/]"
        )
        print_portfolio()
        print_aave_metrics()
        print_allowances()
        #print("block number after:", w3.eth.block_number)



# Multicall Stuff

# First get the authorization
account = Account.from_key(PRIVATE_KEY)

auth = compass.transaction_bundler.bundler_authorization(
    chain=CHAIN, sender=account.address
)

auth_dict = auth.model_dump(mode="json", by_alias=True)

# Sign the authorization
signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

sender = account.address

def multicalling_the_call(length: int):

    action_set = multicall_request_list[0:length]
    print(f" length of set: {len(action_set)}")
    for j in action_set:
        print(j.model_dump(by_alias=True))


    signed_authorization = signed_auth.model_dump(by_alias=True)
    #print(signed_authorization)
    res_multicall = compass.transaction_bundler.bundler_execute(
        chain=CHAIN,
        sender=sender,
        signed_authorization=signed_authorization,
        actions=action_set,
        server_url="http://0.0.0.0:80",
    )
    print(f"tx: {res_multicall}")

    print("GETTING UNSIGNED TRANSACTION 💳💳💳")
    unsigned_transaction = res_multicall.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)

    print(f"⛽️ gas from unsigned multicall tx ⛽️:  {unsigned_transaction['gas']}")

    tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
    print(f"tx_hash: {tx_hash}")

    print("waiting for transaction receipt...")
    print(f"receipt: {w3.eth.wait_for_transaction_receipt(tx_hash)}")
    time.sleep(0)
    print("block number after:", w3.eth.block_number)
    trace = w3.provider.make_request("debug_traceCall", [res_multicall, "latest", {}])
    print(trace)
    #total_gas_trace_call1 = trace["result"]["gas"] # DOESN'T WORK IN MULTICALL FOR SOME REASON

    # time.sleep(2)  # weirdly this makes it work... repay fails without it

    console.print(
        f"[bold cyan]COMPLETED: {1}[/] | [bold magenta]{action_set[-1]}[/] | [bold yellow]{gas_estimate}[/] | [bold green]{"?"}[/]"
    )
    print_portfolio()
    print_aave_metrics()




if __name__ == "__main__":
    print_allowances()
    print_aave_metrics()
    print_portfolio()
    wrap_eth_tx()
    #time.sleep(2)
    uniswap_buy_USDC_tx()
    
    uniswap_buy_USDT_tx()
    #time.sleep(3)
    print_portfolio()
    # multicalling_the_call()
    # time.sleep(3)
    # multicalling_the_call()
    # time.sleep(3)
    # multicalling_the_call()
    # time.sleep(3)
    # multicalling_the_call()
    # time.sleep(3)


    # process_sequential()
    print_portfolio()
    print_aave_metrics()
    multicalling_the_call(10)
    print_aave_metrics()
    print_allowances()
    #print_portfolio()

    # process_with_bundler()

"""
<bound method AaveV3.supply of <compass_api_sdk.aave_v3.AaveV3 object at 0x109fc1be0>> 176537 161940
<bound method AaveV3.borrow of <compass_api_sdk.aave_v3.AaveV3 object at 0x109fc1be0>> 353405 343637
<bound method AaveV3.supply of <compass_api_sdk.aave_v3.AaveV3 object at 0x109fc1be0>> 176540 161940
<bound method AaveV3.borrow of <compass_api_sdk.aave_v3.AaveV3 object at 0x109fc1be0>> 353405 343637
"""


"""
        actions=[
            # Set Allowance
            models.UserOperation(
                body=models.SetAllowanceRequest(
                    ACTION_TYPE="SET_ALLOWANCE",
                    token=models.TokenEnum.WETH,
                    contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
                    amount="0.0001",
                    chain=chain,
                    sender=WALLET,
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
"""



"""
def process_with_bundler():
    iteration = 0
    for function, request in aave_requests:
        d = request.model_dump()
        if "ACTION_TYPE" in d:
            del d["ACTION_TYPE"]
        d["server_url"] = "http://0.0.0.0:80"

        tx = function(**d)
        unsigned_transaction = tx.model_dump(by_alias=True)
        gas_estimate = w3.eth.estimate_gas(unsigned_transaction)

        tx_hash = w3.eth.send_transaction(unsigned_transaction).hex()
        w3.eth.wait_for_transaction_receipt(tx_hash)
        trace = w3.provider.make_request("debug_traceCall", [tx, "latest", {}])
        total_gas_trace_call1 = trace["result"]["gas"]
        iteration = iteration + 1
        #devtools.pprint(iteration, function.__name__, gas_estimate, total_gas_trace_call1)

        print(
            f"[bold]{iteration} | {function.__name__} | {gas_estimate} | {total_gas_trace_call1}[/bold]"
        )
        console.print(
            f"{iteration} | {function.__name__} | {gas_estimate} | {total_gas_trace_call1}",
            style="bold",
        )
"""