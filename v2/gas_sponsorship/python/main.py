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

# ============================================================================
# EXAMPLE 1: Fund Earn Account with Gas Sponsorship
# ============================================================================

# SNIPPET START 3
    # Step 1: Get EIP-712 typed data for Permit2 approval (gas-sponsored)
    # Returns EIP-712 typed data that must be signed by the owner off-chain
    # Note: If allowance is already set, this will raise an error - you can skip to Example 2
    try:
        approve_response = compass_api.gas_sponsorship.gas_sponsorship_approve_transfer(
            owner=WALLET_ADDRESS,
            chain=models.Chain.BASE,
            token="USDC",
            gas_sponsorship=True,
        )
    except Exception as e:
        if "allowance already set" in str(e).lower():
            print("Permit2 approval already exists - skipping to Example 2 (Manage Position)")
            # Skip Example 1 and go to Example 2
            approve_response = None
        else:
            raise
# SNIPPET END 3

# SNIPPET START 4
    # Step 2: Sign EIP-712 typed data with owner's private key (off-chain, no gas)
    # This signature from Step 2 is required as input for Step 3
    owner_account = Account.from_key(OWNER_PRIVATE_KEY if OWNER_PRIVATE_KEY.startswith("0x") else f"0x{OWNER_PRIVATE_KEY}")
    if approve_response and approve_response.eip_712:
        approve_eip712 = approve_response.eip_712
        encoded_data = encode_typed_data(full_message=approve_eip712)
        signed_message = owner_account.sign_message(encoded_data)
        approve_signature = f"0x{signed_message.signature.hex()}"
    else:
        print("Skipping Example 1 - Permit2 approval already exists")
        approve_eip712 = None
        approve_signature = None
# SNIPPET END 4

# SNIPPET START 5
    # Step 3: Prepare gas-sponsored Permit2 approval transaction
    # Uses the signature from Step 2 as input. The sender will pay for gas to execute the Permit2 approval
    sender_account = Account.from_key(SENDER_PRIVATE_KEY if SENDER_PRIVATE_KEY.startswith("0x") else f"0x{SENDER_PRIVATE_KEY}")
    if approve_eip712 and approve_signature:
        prepare_approve_response = compass_api.gas_sponsorship.gas_sponsorship_prepare(
            owner=WALLET_ADDRESS,
            chain=models.Chain.BASE,
            eip_712=approve_eip712.model_dump(by_alias=True),  # Convert to dict
            signature=approve_signature,  # Signature from Step 2
            sender=sender_account.address,
        )
    else:
        prepare_approve_response = None
# SNIPPET END 5

# SNIPPET START 6
    # Step 4: Sign and broadcast Permit2 approval transaction with sender's private key
    if prepare_approve_response:
        w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
        approve_tx_dict = prepare_approve_response.model_dump(by_alias=True)
        signed_approve_tx = w3.eth.account.sign_transaction(approve_tx_dict["transaction"], SENDER_PRIVATE_KEY)
        approve_tx_hash = w3.eth.send_raw_transaction(signed_approve_tx.rawTransaction)
        
        print(f"Permit2 approval transaction hash: {approve_tx_hash.hex()}")
        print(f"View on BaseScan: https://basescan.org/tx/{approve_tx_hash.hex()}")
        
        approve_receipt = w3.eth.wait_for_transaction_receipt(approve_tx_hash)
        print(f"Permit2 approval confirmed in block: {approve_receipt.blockNumber}")
        print("Earn Account can now be funded with gas sponsorship")
    else:
        print("Skipping Example 1 transaction - Permit2 approval already exists")
# SNIPPET END 6

# ============================================================================
# EXAMPLE 2: Manage Earn Position (Deposit) with Gas Sponsorship
# ============================================================================

# SNIPPET START 7
    # Step 1: Get EIP-712 typed data for gas-sponsored deposit
    # Returns EIP-712 typed data that must be signed by the owner off-chain
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
# SNIPPET END 7

# SNIPPET START 8
    # Step 2: Sign EIP-712 typed data with owner's private key (off-chain, no gas)
    # This signature from Step 2 is required as input for Step 3
    # Test code pattern: signs with deposit_tx['eip_712'] which is dict from response.json() (with ints)
    # Sign with the dict structure (ints) - exactly like the test code does
    manage_eip712_output = manage_response.eip_712
    # Get dict format (like response.json()) - with ints, not enums
    eip712_dict = manage_eip712_output.model_dump(by_alias=True, mode="json")
    import json
    eip712_dict = json.loads(json.dumps(eip712_dict, default=str))
    # Sign with dict structure (ints) - matches test code pattern
    encoded_manage_data = encode_typed_data(full_message=eip712_dict)
    signed_manage_message = owner_account.sign_message(encoded_manage_data)
    manage_signature = f"0x{signed_manage_message.signature.hex()}"
# SNIPPET END 8

# SNIPPET START 9
    # Step 3: Prepare gas-sponsored deposit transaction
    # Uses the signature from Step 2 as input. The sender will pay for gas to execute the deposit
    # SDK expects Input model, not Output model - convert dict to Input model
    # FastAPI converts Input model to BatchedSafeOperationsResponse model (same as what we signed with)
    # Backend validates with model_dump() - matches what we signed with
    eip712_input = models.BatchedSafeOperationsResponseInput(**eip712_dict)
    prepare_manage_response = compass_api.gas_sponsorship.gas_sponsorship_prepare(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        eip_712=eip712_input,  # Pass Input model - SDK expects this
        signature=manage_signature,  # Signature from Step 2 (signed with backend model_dump() structure)
        sender=sender_account.address,
    )
# SNIPPET END 9

# SNIPPET START 10
    # Step 4: Sign and broadcast deposit transaction with sender's private key
    manage_tx_dict = prepare_manage_response.model_dump(by_alias=True)
    signed_manage_tx = w3.eth.account.sign_transaction(manage_tx_dict["transaction"], SENDER_PRIVATE_KEY)
    manage_tx_hash = w3.eth.send_raw_transaction(signed_manage_tx.rawTransaction)
    
    print(f"Deposit transaction hash: {manage_tx_hash.hex()}")
    print(f"View on BaseScan: https://basescan.org/tx/{manage_tx_hash.hex()}")
    
    manage_receipt = w3.eth.wait_for_transaction_receipt(manage_tx_hash)
    print(f"Deposit confirmed in block: {manage_receipt.blockNumber}")
    print("Gas-sponsored deposit transaction confirmed")
# SNIPPET END 10

