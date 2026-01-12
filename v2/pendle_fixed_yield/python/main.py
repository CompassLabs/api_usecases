# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
# SNIPPET END 1

# SNIPPET START 2
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
# SNIPPET END 2

# SNIPPET START 3
    # Get unsigned transaction to deposit into Pendle PT fixed yield position
    # Example market: Active USDC market on Base expiring 2026-02-05 with 13% APY
    manage_response = compass_api.earn.earn_manage(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        venue={
            "type": "PENDLE_PT",
            "market_address": "0x9C1e33fFE5e6331879BbE58a8AfB65B632ed7867",
            "token": "USDC",
            "max_slippage_percent": 1,
        },
        action=models.EarnManageRequestAction.DEPOSIT,
        amount="1",
        gas_sponsorship=False,
        fee=None,
    )
# SNIPPET END 3

# SNIPPET START 4
    # Sign and broadcast transaction
    w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
    tx_dict = manage_response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx_dict["transaction"], PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    print(f"Transaction hash: {tx_hash.hex()}")
    print(f"View on BaseScan: https://basescan.org/tx/{tx_hash.hex()}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction confirmed in block: {receipt.blockNumber}")
    print("Deposit into Pendle fixed yield position confirmed!")
# SNIPPET END 4
