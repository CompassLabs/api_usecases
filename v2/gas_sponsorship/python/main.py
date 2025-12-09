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

w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))

def normalize_private_key(key: str) -> str:
    return key if key.startswith("0x") else f"0x{key}"

def sign_eip712(account: Account, eip712: dict) -> str:
    encoded = encode_typed_data(full_message=eip712)
    signed = account.sign_message(encoded)
    return f"0x{signed.signature.hex()}"

def send_transaction(tx_dict: dict, private_key: str) -> str:
    signed_tx = w3.eth.account.sign_transaction(tx_dict, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    tx_hash_hex = f"0x{tx_hash.hex()}"
    print(f"Deposit transaction hash: {tx_hash_hex}")
    print(f"View on BaseScan: https://basescan.org/tx/{tx_hash_hex}")
    print(f"Deposit confirmed in block: {receipt.blockNumber}")
    return tx_hash_hex
# SNIPPET END 1

# SNIPPET START 2
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
    owner_account = Account.from_key(normalize_private_key(OWNER_PRIVATE_KEY))
    sender_account = Account.from_key(normalize_private_key(SENDER_PRIVATE_KEY))
# SNIPPET END 2

# ============================================================================
# EXAMPLE 1: Fund Earn Account with Gas Sponsorship
# ============================================================================

# SNIPPET START 3
    # Get EIP-712 typed data for Permit2 approval
    try:
        approve_response = compass_api.gas_sponsorship.gas_sponsorship_approve_transfer(
            owner=WALLET_ADDRESS,
            chain=models.Chain.BASE,
            token="USDC",
            gas_sponsorship=True,
        )
    except Exception as e:
        if "allowance already set" in str(e).lower():
            print("Permit2 approval already exists - skipping to Example 2")
            approve_response = None
        else:
            raise
# SNIPPET END 3

# SNIPPET START 4
    # Sign EIP-712 typed data with owner's private key
    if approve_response and approve_response.eip_712:
        approve_eip712 = approve_response.eip_712.model_dump(by_alias=True, mode="json")
        approve_signature = sign_eip712(owner_account, approve_eip712)
    else:
        approve_eip712 = None
        approve_signature = None
# SNIPPET END 4

# SNIPPET START 5
    # Prepare and send Permit2 approval transaction
    if approve_eip712 and approve_signature:
        prepare_response = compass_api.gas_sponsorship.gas_sponsorship_prepare(
            owner=WALLET_ADDRESS,
            chain=models.Chain.BASE,
            eip_712=approve_eip712,
            signature=approve_signature,
            sender=sender_account.address,
        )
        tx_dict = prepare_response.model_dump(by_alias=True)["transaction"]
        send_transaction(tx_dict, SENDER_PRIVATE_KEY)
        print("Earn Account can now be funded with gas sponsorship")
    else:
        print("Skipping Example 1 transaction - Permit2 approval already exists")
# SNIPPET END 5

# ============================================================================
# EXAMPLE 2: Manage Earn Position (Deposit) with Gas Sponsorship
# ============================================================================

# SNIPPET START 6
    # Get EIP-712 typed data for deposit
    manage_response = compass_api.earn.earn_manage(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        venue={"type": "VAULT", "vault_address": "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183"},
        action=models.EarnManageRequestAction.DEPOSIT,
        amount="0.5",
        gas_sponsorship=True,
        fee=None,
    )
# SNIPPET END 6

# SNIPPET START 7
    # Sign EIP-712 typed data with owner's private key
    import json
    manage_eip712 = manage_response.eip_712.model_dump(by_alias=True, mode="json")
    manage_eip712 = json.loads(json.dumps(manage_eip712, default=str))
    manage_signature = sign_eip712(owner_account, manage_eip712)
# SNIPPET END 7

# SNIPPET START 8
    # Prepare and send deposit transaction
    eip712_input = models.BatchedSafeOperationsResponseInput(**manage_eip712)
    prepare_response = compass_api.gas_sponsorship.gas_sponsorship_prepare(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        eip_712=eip712_input,
        signature=manage_signature,
        sender=sender_account.address,
    )
    tx_dict = prepare_response.model_dump(by_alias=True)["transaction"]
    send_transaction(tx_dict, SENDER_PRIVATE_KEY)
    print("Gas-sponsored deposit transaction confirmed")
# SNIPPET END 8
