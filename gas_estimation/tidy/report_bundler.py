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
            "--silent",
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


actions = [
    # Set Allowance
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=models.TokenEnum.USDC,
            contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
            amount="100",
        )
    ),
    # Swap WETH for USDC on Uniswap
    models.UserOperation(
        body=models.UniswapBuyExactlyParams(
            ACTION_TYPE="UNISWAP_BUY_EXACTLY",
            token_in=models.TokenEnum.WETH,
            token_out=models.TokenEnum.USDC,
            fee=models.FeeEnum.ZERO_DOT_01,
            max_slippage_percent=0.5,
            amount=1,
            wrap_eth=True,
        )
    ),
]


request_list_bundler = [
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=models.TokenEnum.USDC,
            contract=models.SetAllowanceParamsContractEnum.UNISWAP_V3_ROUTER,
            amount="100",
        )
    ),
    models.UserOperation(
        body=models.SetAllowanceParams(
            ACTION_TYPE="SET_ALLOWANCE",
            token=models.TokenEnum.USDC,
            contract=models.SetAllowanceParamsContractEnum.AAVE_V3_POOL,
            amount="1000",
        )
    ),
    # (
    #     compass.aave_v3.supply,
    #     models.AaveSupplyRequest(token=USDC, amount="10", chain=chain, sender=WALLET),
    # ),
    models.UserOperation(
        body=models.AaveSupplyParams(
            token=models.TokenEnum.USDC,
            amount="10",
            ACTION_TYPE="AAVE_SUPPLY",
        )
    ),
    # (
    #     compass.aave_v3.withdraw,
    #     models.AaveWithdrawRequest(
    #         token=USDC, amount="10", chain=chain, sender=WALLET, recipient=WALLET
    #     ),
    # ),
    models.UserOperation(
        body=models.AaveWithdrawParams(
            token=models.TokenEnum.USDC,
            amount="10",
            recipient=WALLET,
            ACTION_TYPE="AAVE_WITHDRAW",
        )
    ),
]


def process_bundler_requests():
    # First get the authorization
    account = Account.from_key(PRIVATE_KEY)

    auth = compass.transaction_bundler.bundler_authorization(
        chain=models.Chain.ETHEREUM_MAINNET, sender=account.address
    )

    auth_dict = auth.model_dump(mode="json", by_alias=True)
    print(f"AUTH DICT: {auth_dict}")

    # Sign the authorization
    signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

    chain = models.Chain.ETHEREUM_MAINNET
    sender = account.address
    signed_authorization = signed_auth.model_dump(by_alias=True)

    response = compass.transaction_bundler.bundler_execute(
        chain=chain,
        sender=sender,
        signed_authorization=signed_authorization,
        actions=actions,
        # actions=request_list_bundler,
        server_url="http://0.0.0.0:80",
    )

    unsigned_transaction = response.model_dump(by_alias=True)
    print(f"UNSIGNED_TRANSACTION: {unsigned_transaction}")

    gas_estimation = w3.eth.estimate_gas(response.model_dump(by_alias=True))
    trace = w3.provider.make_request(
        "debug_traceCall", [response.model_dump(by_alias=True), "latest", {}]
    )
    print(trace)
    # used_gas = trace["result"]["gas"]
    print(f"GAS ESTIMATION: {gas_estimation}")
    # print(f"GAS USDED: {used_gas}")

    signed_transaction = w3.eth.account.sign_transaction(
        unsigned_transaction, PRIVATE_KEY
    )
    print(signed_transaction)
    txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
    print(txn_hash.hex())
    w3.provider.make_request(RPCEndpoint("evm_mine"), [])
    receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    print("-----RECEIPT------")
    print(receipt)

    # print(sender)
    get_allowance_res = compass.universal.allowance(
        chain=models.GenericAllowanceChain.ETHEREUM_MAINNET,
        token=models.TokenEnum.USDC,
        contract=models.GenericAllowanceContractEnum.UNISWAP_V3_ROUTER,
        user=sender,
        server_url="http://0.0.0.0:80",
    )

    # Handle response
    print(get_allowance_res)


if __name__ == "__main__":
    setup_anvil()
    process_bundler_requests()
