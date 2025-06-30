import os
import json
import atexit
from dotenv import load_dotenv
from web3 import Web3, HTTPProvider
from web3.types import RPCEndpoint
from compass_api_sdk import CompassAPI, models
import time
import subprocess
import subprocess
from datetime import datetime
from compass_api_sdk.models import TokenEnum


# Configuration
RPC_URL = "http://127.0.0.1:8545"
SERVER_URL = "http://0.0.0.0:80"
CHAIN = models.Chain.ETHEREUM_MAINNET
FEE = models.FeeEnum.ZERO_DOT_3
INTEREST_RATE_MODE = models.InterestRateMode.VARIABLE
TOKENS = [TokenEnum.USDC, TokenEnum.USDT, TokenEnum.WETH]
ETH = "ETH"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "gas_estimation_report.json")


# Load environment variables
load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
WALLET = os.getenv("WALLET") or "0xebba555178005Aae650bd32B7B27FBE2cfEe743d"

# Clients
w3 = Web3(HTTPProvider(RPC_URL))
compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

# This will accumulate everything
output_data = {"process_requests": []}


# Helpers
def send_tx(response):
    tx = response.model_dump(by_alias=True)
    tx_hash = w3.eth.send_transaction(tx).hex()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    # convert receipt to a serializable dict
    return tx_hash, dict(receipt)


def collect(section, data):
    """Append a record to output_data at output_data[section]."""
    output_data[section].append(data)
    print({section: data})


# Blockchain setup for Anvil
def setup_anvil():
    subprocess.run(["pkill", "-9", "anvil"])

    anvil_process = subprocess.Popen(
        [
            "anvil",
            "--fork-block-number",
            "22716885",
            "--no-mining",
            "--hardfork",
            "prague",
            "--host",
            "0.0.0.0",
            "--fork-url",
            os.getenv("ETH_RPC"),
            "--port",
            "8545",
            "--chain-id",
            "1",
            "--no-rate-limit",
        ]
    )

    # Optional: wait a few seconds for Anvil to start up
    time.sleep(3)

    # continue with the rest of your script...
    w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
    w3.provider.make_request(
        RPCEndpoint("anvil_setBalance"), [WALLET, hex(100 * 10**18)]
    )
    w3.provider.make_request(RPCEndpoint("evm_setAutomine"), [True])
    return anvil_process


# Data-gathering functions
def get_aave_metrics():
    pos = compass.aave_v3.user_position_per_token(
        chain=CHAIN,
        user=WALLET,
        token=models.AaveUserPositionPerTokenToken.USDC,
        server_url=SERVER_URL,
    )
    summary = compass.aave_v3.user_position_summary(
        chain=CHAIN, user=WALLET, server_url=SERVER_URL
    )
    return {
        "Collateral": summary.total_collateral,
        "Debt": summary.total_debt,
        "ATokenBalance": pos.token_balance,
        "HealthFactor": summary.health_factor,
    }


def get_portfolio():
    return {
        token: compass.token.balance(
            chain=CHAIN, user=WALLET, token=token, server_url=SERVER_URL
        ).amount
        for token in TOKENS
    }


def get_allowances():
    pool = models.GenericAllowanceContractEnum.AAVE_V3_POOL
    return {
        token: compass.universal.allowance(
            chain=CHAIN, user=WALLET, token=token, contract=pool, server_url=SERVER_URL
        ).amount
        for token in TOKENS
    }


# Initial funding via Anvil and swaps
def fund_account():
    print("FUNDING WALLET")
    # wrap ETH
    response = compass.universal.wrap_eth(
        amount=10, chain=CHAIN, sender=WALLET, server_url=SERVER_URL
    )
    tx_hash, receipt = send_tx(response)

    # swaps
    for token in TOKENS:
        if token == TokenEnum.WETH:
            continue
        response = compass.uniswap_v3.swap_buy_exactly(
            token_in=models.TokenEnum.WETH,
            token_out=token,
            fee=FEE,
            max_slippage_percent=0.5,
            amount=2,
            wrap_eth=True,
            chain=CHAIN,
            sender=WALLET,
            server_url=SERVER_URL,
        )
        tx_hash, receipt = send_tx(response)
        # print(get_portfolio())


non_multicall_request_list = [
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=TokenEnum.USDC,
            contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=TokenEnum.USDT,
            contract=models.SetAllowanceRequestContractEnum.AAVE_V3_POOL,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=TokenEnum.USDC,
            contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.universal.allowance_set,
        models.SetAllowanceRequest(
            token=TokenEnum.USDT,
            contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.aave_v3.supply,
        models.AaveSupplyRequest(token=TokenEnum.USDC, amount="2", chain=CHAIN, sender=WALLET),
    ),
    (
        compass.aave_v3.borrow,
        models.AaveBorrowRequest(
            token=TokenEnum.USDT,
            amount="1",
            chain=CHAIN,
            sender=WALLET,
            interest_rate_mode=INTEREST_RATE_MODE,
            on_behalf_of=WALLET
        ),
    ),
    (
        compass.aave_v3.repay,
        models.AaveRepayRequest(
            token=TokenEnum.USDT,
            amount="1",
            chain=CHAIN,
            sender=WALLET,
            interest_rate_mode=INTEREST_RATE_MODE,
        ),
    ),
    (
        compass.aave_v3.withdraw,
        models.AaveWithdrawRequest(
            token=TokenEnum.USDC, amount="2", chain=CHAIN, sender=WALLET, recipient=WALLET
        ),
    ),
    (
        compass.uniswap_v3.swap_sell_exactly,
        models.UniswapSellExactlyRequest(
            token_in=TokenEnum.USDC,
            token_out=TokenEnum.USDT,
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
            token_in=TokenEnum.USDT,
            token_out=TokenEnum.USDC,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
]


# Sequential processing of DeFi actions
def process_requests():
    tasks = non_multicall_request_list

    for idx, (fn, req) in enumerate(tasks, start=1):
        w3.provider.make_request(RPCEndpoint("evm_mine"), [])
        params = req.model_dump()
        params.pop("ACTION_TYPE", None)
        params["server_url"] = SERVER_URL
        response = fn(**params)

        gas_est = w3.eth.estimate_gas(response.model_dump(by_alias=True))
        tx_hash, receipt = send_tx(response)
        trace = w3.provider.make_request(
            "debug_traceCall", [response.model_dump(by_alias=True), "latest", {}]
        )
        used_gas = trace["result"]["gas"]

        collect(
            "process_requests",
            {
                "Step": idx,
                "TimeStamp": datetime.now().isoformat(),
                "Function": fn.__name__,
                "EstGas": gas_est,
                "UsedGas": used_gas,
                "TxHash": tx_hash,
                # "TxReceipt": receipt,
                "TxReceiptStatus": receipt["status"],
                "Portfolio": get_portfolio(),
                "AaveMetrics": get_aave_metrics(),
                "Allowances": get_allowances(),
            },
        )


if __name__ == "__main__":
    # setup
    anvil_process = setup_anvil()
    atexit.register(anvil_process.terminate)
    fund_account()

    # run experiment
    process_requests()

    # process results of experiment
    results = output_data["process_requests"]
    all_success = all(item["TxReceiptStatus"] == 1 for item in results)

    total_est_gas = sum(item["EstGas"] for item in results)
    total_used_gas = sum(item["UsedGas"] for item in results)

    gas_totals = {"TotalEstGas": total_est_gas, "TotalUsedGas": total_used_gas}
    print(f"did all transactions succeed: {all_success}")
    portfolio_afterwards = results[-1]["Portfolio"]
    print(f"portfolio afterwards: {portfolio_afterwards}")
    print(gas_totals)

    # output report
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output_data, f, indent=2)

    # kill anvil
    anvil_process.kill()
