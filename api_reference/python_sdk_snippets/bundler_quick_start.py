from compass_api_sdk import CompassAPI, models
from eth_account import Account
import os
from web3 import Web3
from dotenv import load_dotenv
from web3.types import RPCEndpoint

load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RPC_URL = os.getenv("RPC_URL")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")

# w3 = Web3(Web3.HTTPProvider(RPC_URL))
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))  # ETHEREUM

## only used with anvil
WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"
w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)
## only used with anvil


compass = CompassAPI(api_key_auth=COMPASS_API_KEY)

PRIVATE_KEY = os.getenv("PRIVATE_KEY") # type: ignore[reportConstantRedefinition]

# First get the authorization
account = Account.from_key(PRIVATE_KEY)

auth = compass.transaction_bundler.bundler_authorization(
    chain=models.Chain.ETHEREUM_MAINNET, sender=account.address
)

auth_dict = auth.model_dump(mode="json", by_alias=True)

# Sign the authorization
signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

chain = models.Chain.ETHEREUM_MAINNET
sender = account.address
signed_authorization = signed_auth.model_dump(by_alias=True)

res = compass.transaction_bundler.bundler_execute(
    chain=chain,
    sender=sender,
    signed_authorization=signed_authorization,
    actions=[
        # Set Allowance
        models.UserOperation(
            body=models.IncreaseAllowanceParams(
                ACTION_TYPE="ALLOWANCE_INCREASE",
                token=models.TokenEnum.USDC,
                contract_name=models.IncreaseAllowanceParamsContractName.UNISWAP_V3_ROUTER,
                amount=1,
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
    ],
    server_url="http://0.0.0.0:80",
)

unsigned_transaction = res.model_dump(by_alias=True)
print(unsigned_transaction)

# print("SIGNING MULTICALL TRANSACTION")
# signed_transaction = w3.eth.account.sign_transaction(unsigned_transaction, PRIVATE_KEY)
# print("BROADCASTING MULTICALL TRANSACTION")
#
# txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
# print(txn_hash.hex())
