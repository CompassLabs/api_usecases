# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_typed_data

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")
OWNER_PRIVATE_KEY = os.getenv("OWNER_PRIVATE_KEY")
SENDER_PRIVATE_KEY = os.getenv("SENDER_PRIVATE_KEY")
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
# SNIPPET END 1

# SNIPPET START 2
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
# SNIPPET END 2

# SNIPPET START 3
    # Get EIP-712 typed data for gas-sponsored deposit
    manage_response = compass_api.earn.earn_manage(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        venue={
            "type": "VAULT",
            "vault_address": "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
        },
        action=models.EarnManageRequestAction.DEPOSIT,
        amount="0.5",
        gas_sponsorship=True,
        fee=None,
    )
# SNIPPET END 3

# SNIPPET START 4
    # Sign EIP-712 typed data with owner's private key
    owner_account = Account.from_key(OWNER_PRIVATE_KEY if OWNER_PRIVATE_KEY.startswith("0x") else f"0x{OWNER_PRIVATE_KEY}")
    eip712 = manage_response.eip712
    encoded_data = encode_typed_data(full_message=eip712)
    signed_message = owner_account.sign_message(encoded_data)
    signature = f"0x{signed_message.signature.hex()}"
# SNIPPET END 4

# SNIPPET START 5
    # Prepare gas-sponsored transaction
    sender_account = Account.from_key(SENDER_PRIVATE_KEY if SENDER_PRIVATE_KEY.startswith("0x") else f"0x{SENDER_PRIVATE_KEY}")
    prepare_response = compass_api.gas_sponsorship.gas_sponsorship_prepare(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        eip712=eip712,
        signature=signature,
        sender=sender_account.address,
    )
# SNIPPET END 5

# SNIPPET START 6
    # Sign and broadcast transaction with sender's private key
    w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
    tx_dict = prepare_response.model_dump(by_alias=True)
    signed_tx = w3.eth.account.sign_transaction(tx_dict["transaction"], SENDER_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"Transaction hash: {tx_hash.hex()}")
    print(f"View on BaseScan: https://basescan.org/tx/{tx_hash.hex()}")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction confirmed in block: {receipt.blockNumber}")
    print("Gas-sponsored deposit transaction confirmed")
# SNIPPET END 6

