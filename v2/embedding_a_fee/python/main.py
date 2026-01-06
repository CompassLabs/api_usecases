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
FEE_RECIPIENT = os.getenv("FEE_RECIPIENT")
# SNIPPET END 1

# SNIPPET START 2
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
# SNIPPET END 2

# SNIPPET START 3
    # Get unsigned transaction to withdraw from vault with performance fee
    manage_response = compass_api.earn.earn_manage(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        venue={
            "type": "VAULT",
            "vault_address": "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
        },
        action=models.EarnManageRequestAction.WITHDRAW,
        amount="10",  # Amount to withdraw
        gas_sponsorship=False,
        fee={
            "recipient": FEE_RECIPIENT,
            "amount": "20",  # 20% of profit
            "denomination": models.Denomination.PERFORMANCE,
        },
    )
# SNIPPET END 3

# SNIPPET START 4
    # Sign and broadcast transaction
    w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
    tx_dict = manage_response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx_dict["transaction"], PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    print(f"Transaction hash: {w3.to_hex(tx_hash)}")
    print(f"View on BaseScan: https://basescan.org/tx/{w3.to_hex(tx_hash)}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction confirmed in block: {receipt.blockNumber}")
    print("Withdrawal with performance fee transaction confirmed")
# SNIPPET END 4
