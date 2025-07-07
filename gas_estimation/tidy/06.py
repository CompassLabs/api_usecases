from compass_api_sdk import CompassAPI, models
from eth_account import Account
import os
from web3 import Web3
from web3.types import RPCEndpoint

import dotenv

dotenv.load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RPC_URL = "http://127.0.0.1:8545"  # os.getenv("RPC_URL")


w3 = Web3(Web3.HTTPProvider(RPC_URL))


WALLET = os.getenv(
    "WALLET"
)  # DANGER... MAKE A NEW ACCOUNT FROM SCRATCH WITH NEW METAMASK
w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)
w3.provider.make_request(RPCEndpoint("evm_setAutomine"), True)


print(PRIVATE_KEY, RPC_URL, os.getenv("COMPASS_API_KEY"))

with CompassAPI(
    api_key_auth=os.getenv("COMPASS_API_KEY"),
) as compass_api:
    # First get the authorization
    account = Account.from_key(PRIVATE_KEY)

    auth = compass_api.transaction_bundler.bundler_authorization(
        chain=models.Chain.ETHEREUM_MAINNET, sender=account.address
    )

    auth_dict = auth.model_dump(mode="json", by_alias=True)
    print(f"AUTH DICT: {auth_dict}")

    # Sign the authorization
    signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

    chain = models.Chain.ETHEREUM_MAINNET
    sender = account.address
    signed_authorization = signed_auth.model_dump(by_alias=True)

    res = compass_api.transaction_bundler.bundler_execute(
        chain=chain,
        sender=sender,
        signed_authorization=signed_authorization,
        actions=[
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
        ],
        server_url="http://0.0.0.0:80",
    )

    unsigned_transaction = res.model_dump(by_alias=True)
    print(f"UNSIGNED_TRANSACTION: {unsigned_transaction}")

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
    get_allowance_res = compass_api.universal.allowance(
        chain=models.GenericAllowanceChain.ETHEREUM_MAINNET,
        token=models.TokenEnum.USDC,
        contract=models.GenericAllowanceContractEnum.UNISWAP_V3_ROUTER,
        user=sender,
        server_url="http://0.0.0.0:80",
    )

    # Handle response
    print(get_allowance_res)
