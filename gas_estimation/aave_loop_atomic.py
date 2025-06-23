import time
from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
import os
from compass_api_sdk import CompassAPI, models
from decimal import Decimal

time.sleep(5)
load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")

w3 = Web3(HTTPProvider("http://127.0.0.1:8545"))  # ETHEREUM


# Get account
WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])

w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)

compass = CompassAPI(api_key_auth=COMPASS_API_KEY)
chain = models.TokenBalanceChain.ETHEREUM_MAINNET


def print_usdc_balance():
    res = compass.token.balance(
        chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token=models.TokenEnum.USDC,
        server_url="http://0.0.0.0:80",
    )
    print(f" USDC balance: {res.amount}")
    pass


def print_weth_balance():
    res = compass.token.balance(
        chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token=models.TokenEnum.WETH,
        server_url="http://0.0.0.0:80",
    )
    print(f" WETH balance: {res.amount}")
    pass


def print_eth_balance():
    res = compass.token.balance(
        chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token="ETH",
        server_url="http://0.0.0.0:80",
    )
    print(f" ETH balance: {res.amount}")
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
        amount=1000,
        wrap_eth=True,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    # print(unsigned_transaction)
    print(w3.eth.send_transaction(unsigned_transaction).hex())
    return unsigned_transaction


print_eth_balance()
print_weth_balance()
print_usdc_balance()

print("getting usdc + weth... ")
wrap_eth_tx()
time.sleep(4)
uniswap_buy_tx()
time.sleep(4)


print_eth_balance()
print_weth_balance()
print_usdc_balance()

print_eth_balance()
print("🏁 START 🏁")


def set_allowance_1():
    res = compass.universal.allowance_set(
        token=models.TokenEnum.USDC,
        contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
        amount=100,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- set allowance: usdc aave")


def set_allowance_2():
    res = compass.universal.allowance_set(
        token=models.TokenEnum.WETH,
        contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
        amount=1,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- set allowance: weth uniswap")


def aave_supply_1(amount: Decimal):
    res = compass.aave_v3.supply(
        token=models.TokenEnum.USDC,
        amount=amount,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave supply: USDC -- amount = {amount}"
    )


def aave_borrow_1(amount: Decimal):
    res = compass.aave_v3.borrow(
        token=models.TokenEnum.WETH,
        amount=amount,
        interest_rate_mode=models.InterestRateMode.VARIABLE,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave borrow: WETH -- amount = {amount}"
    )


def uniswap_1(amount: Decimal):
    res = compass.uniswap_v3.swap_sell_exactly(
        token_in=models.TokenEnum.WETH,
        token_out=models.TokenEnum.USDC,
        fee=models.FeeEnum.ZERO_DOT_05,
        amount=amount,
        max_slippage_percent=2.5,
        chain=chain,
        sender=WALLET,
        wrap_eth=False,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- uniswap sell: WETH for USDC -- amount = {amount}")


def aave_supply_2(amount: Decimal):
    res = compass.aave_v3.supply(
        token=models.TokenEnum.USDC,
        amount=amount,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave supply: USDC -- amount = {amount}"
    )


def aave_borrow_2(amount: Decimal):
    res = compass.aave_v3.borrow(
        token=models.TokenEnum.WETH,
        amount=amount,
        interest_rate_mode=models.InterestRateMode.VARIABLE,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave borrow: WETH -- amount = {amount}"
    )


def uniswap_2(amount: Decimal):
    res = compass.uniswap_v3.swap_sell_exactly(
        token_in=models.TokenEnum.WETH,
        token_out=models.TokenEnum.USDC,
        fee=models.FeeEnum.ZERO_DOT_05,
        amount=amount,
        max_slippage_percent=2.5,
        chain=chain,
        sender=WALLET,
        wrap_eth=False,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- uniswap sell: WETH for USDC -- amount = {amount}"
    )


def aave_supply_3(amount: Decimal):
    res = compass.aave_v3.supply(
        token=models.TokenEnum.USDC,
        amount=amount,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave supply: USDC -- amount = {amount}"
    )


def aave_borrow_3(amount: Decimal):
    res = compass.aave_v3.borrow(
        token=models.TokenEnum.WETH,
        amount=amount,
        interest_rate_mode=models.InterestRateMode.VARIABLE,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave borrow: WETH -- amount = {amount}"
    )


def uniswap_3(amount: Decimal):
    res = compass.uniswap_v3.swap_sell_exactly(
        token_in=models.TokenEnum.WETH,
        token_out=models.TokenEnum.USDC,
        fee=models.FeeEnum.ZERO_DOT_05,
        amount=amount,
        max_slippage_percent=2.5,
        chain=chain,
        sender=WALLET,
        wrap_eth=False,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- uniswap sell: WETH for USDC -- amount = {amount}"
    )


def aave_supply_4(amount: Decimal):
    res = compass.aave_v3.supply(
        token=models.TokenEnum.USDC,
        amount=amount,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave supply: USDC -- amount = {amount}"
    )


def aave_borrow_4(amount: Decimal):
    res = compass.aave_v3.borrow(
        token=models.TokenEnum.WETH,
        amount=amount,
        interest_rate_mode=models.InterestRateMode.VARIABLE,
        chain=chain,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    gas_estimate = w3.eth.estimate_gas(unsigned_transaction)
    w3.eth.send_transaction(unsigned_transaction).hex()
    time.sleep(2)
    print(
        f"⛽️ GAS ESTIMATE: {gas_estimate} ⛽️ -- aave borrow: WETH -- amount = {amount}"
    )


def round_5(x: Decimal):
    return round(x, 5)

set_allowance_1()
set_allowance_2()
aave_supply_1(
    amount=Decimal("10.0"),
)
aave_borrow_1(
    amount=round_5(Decimal("0.003116921336955553576200231585")),
)
uniswap_1(
    amount=round_5(Decimal("0.003116921336955553576200231585")),
)
aave_supply_2(
    amount=round_5(Decimal("7.007865000000000000000000000")),
)
aave_borrow_2(
    amount=round_5(Decimal("0.002184296394500403046227843591")),
)
uniswap_2(
    amount=round_5(Decimal("0.002184296394500403046227843591")),
)
aave_supply_3(
    amount=round_5(Decimal("4.911005992135000576513492732")),
)
aave_borrow_3(
    amount=round_5(Decimal("0.001530721936280216082783257217")),
)
uniswap_3(
    amount=round_5(Decimal("0.001530721936280216082783257217")),
)
aave_supply_4(
    amount=round_5(Decimal("3.08112900786499942348650727")),
)
aave_borrow_4(
    amount=round_5(Decimal("0.0009603636746527112352892465685")),
)


# set_allowance_2(0.007)
# set_allowance_2(1)
# set_allowance_2(1000)
# set_allowance_2(10000000)


time.sleep(1)

print_eth_balance()
time.sleep(1)
