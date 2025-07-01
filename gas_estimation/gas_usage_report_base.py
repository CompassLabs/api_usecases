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
from eth_account import Account
import devtools
import webbrowser


# Load environment variables
load_dotenv()
BASE_MAINNET_RPC_URL = os.getenv("BASE_MAINNET_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
WALLET = os.getenv("WALLET")
RPC_URL = BASE_MAINNET_RPC_URL


# Configuration
# SERVER_URL = "http://0.0.0.0:80"
SERVER_URL = "https://api.compasslabs.ai/"
CHAIN = models.Chain.BASE_MAINNET
FEE = models.FeeEnum.ZERO_DOT_3
INTEREST_RATE_MODE = models.InterestRateMode.VARIABLE
TOKENS = [TokenEnum.USDC, TokenEnum.GHO, TokenEnum.WETH]
ETH = "ETH"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "gas_estimation_report.json")


# Clients
w3 = Web3(HTTPProvider(RPC_URL))
compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

# This will accumulate everything
output_data = {
    "sequential_requests": [],
    "sequential_gas_totals": [],
    "bundler_requests": [],
    "bundler_gas_totals": [],
}


# Helpers
def send_tx(response):
    tx = response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction).hex()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    # convert receipt to a serializable dict
    return tx_hash, dict(receipt)


def collect(section, data):
    """Append a record to output_data at output_data[section]."""
    output_data[section].append(data)
    print({section: data})


def open_tx_hash_on_basescan(hash: str):
    url = "https://basescan.org/tx/0x" + hash
    webbrowser.open(url)


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
        "LiquidationThreshold": summary.liquidation_threshold,
    }


def get_portfolio():
    return {
        token: compass.token.balance(
            chain=CHAIN, user=WALLET, token=token, server_url=SERVER_URL
        ).amount
        for token in TOKENS + ["ETH"]
    }


def get_allowances():
    pool = models.GenericAllowanceContractEnum.AAVE_V3_POOL
    return {
        token: compass.universal.allowance(
            chain=CHAIN, user=WALLET, token=token, contract=pool, server_url=SERVER_URL
        ).amount
        for token in TOKENS
    }


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
            token=TokenEnum.GHO,
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
            token=TokenEnum.GHO,
            contract=models.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER,
            amount="10",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
    (
        compass.aave_v3.supply,
        models.AaveSupplyRequest(
            token=TokenEnum.USDC, amount="2", chain=CHAIN, sender=WALLET
        ),
    ),
    (
        compass.aave_v3.borrow,
        models.AaveBorrowRequest(
            token=TokenEnum.GHO,
            amount="1",
            chain=CHAIN,
            sender=WALLET,
            interest_rate_mode=INTEREST_RATE_MODE,
            on_behalf_of=WALLET,
        ),
    ),
    (
        compass.aave_v3.repay,
        models.AaveRepayRequest(
            token=TokenEnum.GHO,
            amount="1",
            chain=CHAIN,
            sender=WALLET,
            interest_rate_mode=INTEREST_RATE_MODE,
        ),
    ),
    (
        compass.aave_v3.withdraw,
        models.AaveWithdrawRequest(
            token=TokenEnum.USDC,
            amount="2",
            chain=CHAIN,
            sender=WALLET,
            recipient=WALLET,
        ),
    ),
    (
        compass.uniswap_v3.swap_sell_exactly,
        models.UniswapSellExactlyRequest(
            token_in=TokenEnum.USDC,
            token_out=TokenEnum.GHO,
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
            token_in=TokenEnum.GHO,
            token_out=TokenEnum.USDC,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            chain=CHAIN,
            sender=WALLET,
        ),
    ),
]


request_list_bundler = [
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=models.TokenEnum.USDC,
            contract=models.SetAllowanceParamsContractEnum.AAVE_V3_POOL,
            amount="77",
        )
    ),
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=models.TokenEnum.GHO,
            contract=models.SetAllowanceParamsContractEnum.AAVE_V3_POOL,
            amount="77",
        )
    ),
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=models.TokenEnum.USDC,
            contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
            amount="77",
        )
    ),
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=models.TokenEnum.GHO,
            contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
            amount="77",
        )
    ),
    models.UserOperation(
        body=models.AaveSupplyParams(
            ACTION_TYPE="AAVE_SUPPLY",
            token=models.TokenEnum.USDC,
            on_behalf_of=WALLET,
            amount="2",
        )
    ),
    models.UserOperation(
        body=models.AaveBorrowParams(
            token=models.TokenEnum.GHO,
            amount="1",
            interest_rate_mode=INTEREST_RATE_MODE,
            ACTION_TYPE="AAVE_BORROW",
            on_behalf_of=WALLET,
        )
    ),
    models.UserOperation(
        body=models.AaveRepayParams(
            token=models.TokenEnum.GHO,
            amount="1",
            interest_rate_mode=INTEREST_RATE_MODE,
            ACTION_TYPE="AAVE_REPAY",
            on_behalf_of=WALLET,
        )
    ),
    models.UserOperation(
        body=models.AaveWithdrawParams(
            token=models.TokenEnum.USDC,
            amount="2",
            recipient=WALLET,
            ACTION_TYPE="AAVE_WITHDRAW",
        )
    ),
    models.UserOperation(
        body=models.UniswapSellExactlyParams(
            token_in=models.TokenEnum.USDC,
            token_out=models.TokenEnum.GHO,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            ACTION_TYPE="UNISWAP_SELL_EXACTLY",
            wrap_eth=False,
        )
    ),
    models.UserOperation(
        body=models.UniswapBuyExactlyParams(
            token_in=models.TokenEnum.GHO,
            token_out=models.TokenEnum.USDC,
            fee=FEE,
            amount="1",
            max_slippage_percent="0.2",
            ACTION_TYPE="UNISWAP_BUY_EXACTLY",
            wrap_eth=False,
        )
    ),
]


def process_bundler_requests():
    # First get the authorization
    account = Account.from_key(PRIVATE_KEY)

    auth = compass.transaction_bundler.bundler_authorization(
        chain=CHAIN, sender=account.address
    )

    auth_dict = auth.model_dump(mode="json", by_alias=True)
    print(f"AUTH DICT: {auth_dict}")
    devtools.debug(auth_dict["nonce"])

    # Sign the authorization
    signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

    chain = CHAIN
    sender = account.address
    signed_authorization = signed_auth.model_dump(by_alias=True)

    response = compass.transaction_bundler.bundler_execute(
        chain=chain,
        sender=sender,
        signed_authorization=signed_authorization,
        # actions = actions,
        actions=request_list_bundler,
        server_url=SERVER_URL,
    )

    unsigned_transaction = response.model_dump(by_alias=True)
    print(f"UNSIGNED_TRANSACTION: {unsigned_transaction}")
    devtools.debug(unsigned_transaction["nonce"])

    gas_estimation = w3.eth.estimate_gas(response.model_dump(by_alias=True))
    trace = w3.provider.make_request(
        "debug_traceCall", [response.model_dump(by_alias=True), "latest", {}]
    )
    # print(trace)
    # used_gas = trace["result"]["gas"]
    print(f"GAS ESTIMATION: {gas_estimation}")
    # print(f"GAS USDED: {used_gas}")

    signed_transaction = w3.eth.account.sign_transaction(
        unsigned_transaction, PRIVATE_KEY
    )
    print(signed_transaction)
    txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
    print(txn_hash.hex())
    # open_tx_hash_on_basescan(txn_hash.hex())
    # w3.provider.make_request(RPCEndpoint("evm_mine"), [])
    receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    print("-----RECEIPT------")
    print(receipt)


# Sequential processing of DeFi actions
def process_sequential_requests():
    tasks = non_multicall_request_list

    for idx, (fn, req) in enumerate(tasks, start=1):
        devtools.debug(fn.__name__)
        if fn.__name__ == "repay":
            devtools.debug("IF STATEMENT TRIGGERED")
            params = models.AaveRepayRequest(
                token=TokenEnum.GHO,
                amount=get_aave_metrics()['Debt'],
                chain=CHAIN,
                sender=WALLET,
                interest_rate_mode=INTEREST_RATE_MODE,
            ).model_dump()
            devtools.debug(params)

        else:
            params = req.model_dump()
            devtools.debug(params)

        # w3.provider.make_request(RPCEndpoint("evm_mine"), [])
        params.pop("ACTION_TYPE", None)
        params["server_url"] = SERVER_URL
        response = fn(**params)
        gas_est = w3.eth.estimate_gas(response.model_dump(by_alias=True))
        tx_hash, receipt = send_tx(response)
        time.sleep(5)
        # trace = w3.provider.make_request(
        #     "debug_traceCall", [response.model_dump(by_alias=True), "latest", {}]
        # )
        # used_gas = trace["result"]["gas"]
        used_gas = receipt["gasUsed"]

        collect(
            "sequential_requests",
            {
                "step": idx,
                "time_stamp": datetime.now().isoformat(),
                "function": fn.__name__,
                "estimated_gas": gas_est,
                "used_gas": used_gas,
                "tx_hash": tx_hash,
                # "TxReceipt": receipt,
                "tx_receipt_status": receipt["status"],
                "portfolio": get_portfolio(),
                "aave_metrics": get_aave_metrics(),
                "allowances": get_allowances(),
            },
        )


if __name__ == "__main__":
    # setup

    # send_tx(
    #     compass.universal.wrap_eth(
    #         amount=10,
    #         chain=CHAIN,
    #         sender=WALLET,
    #         server_url=SERVER_URL
    #     )
    # )

    # process_bundler_requests()

    import devtools

    devtools.debug(get_aave_metrics())
    devtools.debug(get_portfolio())
    devtools.debug(get_allowances())

    # run experiment
    # process_bundler_requests()
    process_sequential_requests()

    devtools.debug(get_aave_metrics())
    devtools.debug(get_portfolio())
    devtools.debug(get_allowances())

    # process results of experiment
    results = output_data["sequential_requests"]
    all_success = all(item["tx_receipt_status"] == 1 for item in results)

    total_est_gas = sum(item["estimated_gas"] for item in results)
    total_used_gas = sum(item["used_gas"] for item in results)

    gas_totals = {
        "total_estimated_gas": total_est_gas,
        "total_used_gas": total_used_gas,
    }
    print(f"did all transactions succeed: {all_success}")
    portfolio_afterwards = results[-1]["portfolio"]
    print(f"portfolio afterwards: {portfolio_afterwards}")
    print(gas_totals)

    collect("sequential_gas_totals", gas_totals)

    # output report
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output_data, f, indent=2)
    #
    # # kill anvil
    # anvil_process.kill()
