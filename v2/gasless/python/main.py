# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv
from web3 import Web3
from eth_account.messages import encode_typed_data

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
OWNER_ADDRESS = os.getenv("OWNER_ADDRESS")
OWNER_PRIVATE_KEY = os.getenv("OWNER_PRIVATE_KEY")
SENDER_ADDRESS = os.getenv("SENDER_ADDRESS")
SENDER_PRIVATE_KEY = os.getenv("SENDER_PRIVATE_KEY")
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
# SNIPPET END 1

# SNIPPET START 2
w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
owner_account = w3.eth.account.from_key(OWNER_PRIVATE_KEY)
sender_account = w3.eth.account.from_key(SENDER_PRIVATE_KEY)

with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
# SNIPPET END 2

    # NOTE: Step 1 already completed - approval is one-time per token
    # print("\n=== Step 1: Approve Token Transfer (One-time per token) ===\n")

    print("=== Step 2: Fund Earn Account with Gas Sponsorship ===\n")

# SNIPPET START 7
    # Get EIP-712 typed data for gas-sponsored transfer
    transfer_response = compass_api.earn.earn_transfer(
        owner=OWNER_ADDRESS,
        chain=models.Chain.BASE,
        token="USDC",
        amount="0.1",
        action=models.EarnTransferRequestAction.DEPOSIT,
        gas_sponsorship=True,
        spender=SENDER_ADDRESS,
    )

    print("EIP-712 typed data received for transfer")
# SNIPPET END 7

# SNIPPET START 8
    # Owner signs the transfer typed data off-chain
    transfer_typed_data = transfer_response.eip_712.model_dump(by_alias=True)
    transfer_encoded = encode_typed_data(full_message=transfer_typed_data)
    transfer_signature = owner_account.sign_message(transfer_encoded).signature.hex()

    print("Owner signed transfer off-chain")
# SNIPPET END 8

# SNIPPET START 9
    # Prepare gas-sponsored transfer transaction
    prepare_transfer_response = compass_api.gas_sponsorship.gas_sponsorship_prepare(
        owner=OWNER_ADDRESS,
        chain=models.Chain.BASE,
        eip_712=transfer_typed_data,
        signature=transfer_signature,
        sender=SENDER_ADDRESS,
    )

    print("Gas-sponsored transfer transaction prepared")
# SNIPPET END 9

# SNIPPET START 10
    # Sender signs and broadcasts the transfer transaction
    transfer_tx_dict = prepare_transfer_response.model_dump(by_alias=True)["transaction"]
    signed_transfer_tx = sender_account.sign_transaction(transfer_tx_dict)
    transfer_tx_hash = w3.eth.send_raw_transaction(signed_transfer_tx.raw_transaction)

    print(f"Transfer tx hash: {w3.to_hex(transfer_tx_hash)}")
    print(f"View on BaseScan: https://basescan.org/tx/{w3.to_hex(transfer_tx_hash)}")

    transfer_receipt = w3.eth.wait_for_transaction_receipt(transfer_tx_hash)
    print(f"Transfer confirmed in block: {transfer_receipt.blockNumber}")
    print("✓ Earn Account funded with gas sponsorship!\n")
# SNIPPET END 10
