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
    # Get unsigned transaction to deposit into Morpho vault
    manage_response = compass_api.earn.earn_manage(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        venue={
            "type": "VAULT",
            "vault_address": "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
        },
        action=models.EarnManageRequestAction.DEPOSIT,
        amount="0.5",
        gas_sponsorship=False,
        fee=None,
    )
# SNIPPET END 3

# SNIPPET START 4
    # Sign and broadcast transaction
    w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
    tx_dict = manage_response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx_dict["transaction"], PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"Transaction hash: {tx_hash.hex()}")
    print(f"View on BaseScan: https://basescan.org/tx/{tx_hash.hex()}")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction confirmed in block: {receipt.blockNumber}")
    print("Deposit transaction confirmed")
# SNIPPET END 4

# SNIPPET START 5
    # Check Earn Account positions
    positions_response = compass_api.earn.earn_positions(
        chain=models.Chain.BASE,
        user_address=WALLET_ADDRESS,
        days=100,
    )
    
    print(f"\nPositions: {len(positions_response.user_positions)}")
    for position in positions_response.user_positions:
        if position.TYPE == "VAULT":
            print(f"{position.vault_name}: {position.amount_in_underlying_token} {position.token_name}")
        elif position.TYPE == "AAVE":
            print(f"Aave {position.token_name}: {position.amount_in_underlying_token}")
# SNIPPET END 5

