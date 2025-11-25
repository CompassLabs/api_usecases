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
    # Get unsigned transaction to fund Earn Account with USDC
    transfer_response = compass_api.earn.earn_transfer(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        token="USDC",
        amount="2",
        action=models.EarnTransferRequestAction.DEPOSIT,
        gas_sponsorship=False,
    )
# SNIPPET END 3

# SNIPPET START 4
    # Sign and broadcast transaction
    w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
    tx_dict = transfer_response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx_dict["transaction"], PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

    print(f"Transaction hash: {tx_hash.hex()}")
    print(f"View on BaseScan: https://basescan.org/tx/{tx_hash.hex()}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction confirmed in block: {receipt.blockNumber}")
    print("Earn Account funded successfully!")
# SNIPPET END 4

