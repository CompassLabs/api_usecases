# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
from eth_account import Account
import os
from web3 import Web3
import dotenv

dotenv.load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RPC_URL = os.getenv("RPC_URL")

w3 = Web3(Web3.HTTPProvider(RPC_URL))

with CompassAPI(
        api_key_auth=os.getenv("COMPASS_API_KEY"),
) as compass_api:
    # First get the authorization
    account = Account.from_key(PRIVATE_KEY)

    # SNIPPET END 1

    # SNIPPET START 2
    auth = compass_api.transaction_batching.authorization(
        chain=models.Chain.ETHEREUM_MAINNET,
        sender=account.address
    )

    auth_dict = auth.model_dump(mode='json', by_alias=True)

    # Sign the authorization
    signed_auth = Account.sign_authorization(auth_dict, PRIVATE_KEY)

    # SNIPPET END 2

    # SNIPPET START 3
    chain = models.Chain.ETHEREUM_MAINNET
    sender = account.address
    signed_authorization = signed_auth.model_dump(by_alias=True)

    # SNIPPET START 4
    res = compass_api.transaction_batching.execute(
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
                    amount="1",
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
    )

    # SNIPPET END 4

    # SNIPPET START 5
    unsigned_transaction = res.model_dump(by_alias=True)
    signed_transaction = w3.eth.account.sign_transaction(unsigned_transaction, PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)
    print(txn_hash.hex())
    # SNIPPET END 5