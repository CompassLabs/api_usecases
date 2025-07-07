import os
import time
from dotenv import load_dotenv
from web3 import Web3, HTTPProvider
from web3.types import RPCEndpoint
from compass_api_sdk import CompassAPI, models

# Configuration
RPC_URL = "http://127.0.0.1:8545"
SERVER_URL = "http://0.0.0.0:80"
CHAIN = models.Chain.ETHEREUM_MAINNET
FEE = models.FeeEnum.ZERO_DOT_3
INTEREST_RATE_MODE = models.InterestRateMode.VARIABLE
TOKENS = {
    "USDC": models.TokenEnum.USDC,
    "USDT": models.TokenEnum.USDT,
    "WETH": models.TokenEnum.WETH,
    "ETH": "ETH",
}

# Load environment variables
load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
WALLET = os.getenv("WALLET") or "0xebba555178005Aae650bd32B7B27FBE2cfEe743d"

# Clients
w3 = Web3(HTTPProvider(RPC_URL))
compass = CompassAPI(api_key_auth=COMPASS_API_KEY)


# Helpers
def send_tx(response):
    tx = response.model_dump(by_alias=True)
    tx_hash = w3.eth.send_transaction(tx).hex()
    w3.eth.wait_for_transaction_receipt(tx_hash)


# Blockchain setup for Anvil
def setup_anvil():
    w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
    w3.provider.make_request(
        RPCEndpoint("anvil_setBalance"), [WALLET, hex(100 * 10**18)]
    )
    w3.provider.make_request(RPCEndpoint("evm_setAutomine"), [True])


# Display functions
def print_aave_metrics():
    pos = compass.aave_v3.user_position_per_token(
        chain=CHAIN,
        user=WALLET,
        token=models.AaveUserPositionPerTokenToken.USDC,
        server_url=SERVER_URL,
    )
    summary = compass.aave_v3.user_position_summary(
        chain=CHAIN, user=WALLET, server_url=SERVER_URL
    )
    print(
        f"SUMMARY: Collateral={summary.total_collateral}, Debt={summary.total_debt}, "
        f"TokenBalance={pos.token_balance}, HealthFactor={summary.health_factor}"
    )


def print_portfolio():
    balances = {
        name: compass.token.balance(
            chain=CHAIN, user=WALLET, token=token, server_url=SERVER_URL
        ).amount
        for name, token in TOKENS.items()
    }
    entries = " | ".join(f"{n}: {amt}" for n, amt in balances.items())
    print(f"PORTFOLIO | {entries}")


def print_allowances():
    pool = models.GenericAllowanceContractEnum.AAVE_V3_POOL
    allowances = {
        name: compass.universal.allowance(
            chain=CHAIN, user=WALLET, token=token, contract=pool, server_url=SERVER_URL
        ).amount
        for name, token in TOKENS.items()
        if name in ("USDC", "USDT", "WETH")
    }
    print("ALLOWANCES:")
    for name, amt in allowances.items():
        print(f"  {name}: {amt}")


# Initial funding via Anvil and swaps
def fund_account():
    print("Funding account...")
    send_tx(
        compass.universal.wrap_eth(
            amount=10, chain=CHAIN, sender=WALLET, server_url=SERVER_URL
        )
    )
    for tok in ("USDC", "USDT"):
        send_tx(
            compass.uniswap_v3.swap_buy_exactly(
                token_in=models.TokenEnum.WETH,
                token_out=TOKENS[tok],
                fee=FEE,
                max_slippage_percent=0.5,
                amount=2,
                wrap_eth=True,
                chain=CHAIN,
                sender=WALLET,
                server_url=SERVER_URL,
            )
        )
    print_portfolio()
    print("Account funded")


# Sequential processing of DeFi actions
def process_requests():
    tasks = [
        (
            compass.universal.allowance_set,
            models.SetAllowanceRequest(
                token=models.TokenEnum.USDC,
                contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
                amount="10",
                chain=CHAIN,
                sender=WALLET,
            ),
        ),
        (
            compass.universal.allowance_set,
            models.SetAllowanceRequest(
                token=models.TokenEnum.USDT,
                contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
                amount="10",
                chain=CHAIN,
                sender=WALLET,
            ),
        ),
        (
            compass.universal.allowance_set,
            models.SetAllowanceRequest(
                token=models.TokenEnum.USDC,
                contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
                amount="10",
                chain=CHAIN,
                sender=WALLET,
            ),
        ),
        (
            compass.universal.allowance_set,
            models.SetAllowanceRequest(
                token=models.TokenEnum.USDT,
                contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
                amount="10",
                chain=CHAIN,
                sender=WALLET,
            ),
        ),
        (
            compass.aave_v3.supply,
            models.AaveSupplyRequest(
                token=models.TokenEnum.USDC, amount="2", chain=CHAIN, sender=WALLET
            ),
        ),
        (
            compass.aave_v3.borrow,
            models.AaveBorrowRequest(
                token=models.TokenEnum.USDT,
                amount="1",
                chain=CHAIN,
                sender=WALLET,
                interest_rate_mode=INTEREST_RATE_MODE,
            ),
        ),
        (
            compass.aave_v3.repay,
            models.AaveRepayRequest(
                token=models.TokenEnum.USDT,
                amount="1",
                chain=CHAIN,
                sender=WALLET,
                interest_rate_mode=INTEREST_RATE_MODE,
            ),
        ),
        (
            compass.aave_v3.withdraw,
            models.AaveWithdrawRequest(
                token=models.TokenEnum.USDC,
                amount="2",
                chain=CHAIN,
                sender=WALLET,
                recipient=WALLET,
            ),
        ),
        (
            compass.uniswap_v3.swap_sell_exactly,
            models.UniswapSellExactlyRequest(
                token_in=models.TokenEnum.USDC,
                token_out=models.TokenEnum.USDT,
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
                token_in=models.TokenEnum.USDT,
                token_out=models.TokenEnum.USDC,
                fee=FEE,
                amount="1",
                max_slippage_percent="0.2",
                chain=CHAIN,
                sender=WALLET,
            ),
        ),
    ]

    for idx, (fn, req) in enumerate(tasks, start=1):
        w3.provider.make_request(RPCEndpoint("evm_mine"), [])
        params = req.model_dump()
        params.pop("ACTION_TYPE", None)
        params["server_url"] = SERVER_URL
        response = fn(**params)
        gas_est = w3.eth.estimate_gas(response.model_dump(by_alias=True))
        send_tx(response)
        trace = w3.provider.make_request(
            "debug_traceCall", [response.model_dump(by_alias=True), "latest", {}]
        )
        used_gas = trace["result"]["gas"]
        print(f"{idx}. {fn.__name__} → EstGas={gas_est}, UsedGas={used_gas}")
        print_portfolio()
        print_aave_metrics()
        print_allowances()


if __name__ == "__main__":
    setup_anvil()
    fund_account()
    process_requests()
