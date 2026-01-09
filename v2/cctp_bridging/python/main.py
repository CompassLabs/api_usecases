# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv
from web3 import Web3
import time

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
ARBITRUM_RPC_URL = os.getenv("ARBITRUM_RPC_URL")
# SNIPPET END 1

# SNIPPET START 2
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:

    # Initialize Web3 clients for both chains
    base_w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
    arbitrum_w3 = Web3(Web3.HTTPProvider(ARBITRUM_RPC_URL))
# SNIPPET END 2

    print("=== CCTP Bridge: Base -> Arbitrum ===\n")

# SNIPPET START 3
    # Step 1: Burn USDC on Base (source chain)
    print("Step 1: Burning USDC on Base...\n")

    burn_response = compass_api.bridge.cctp_burn(
        owner=WALLET_ADDRESS,
        chain=models.Chain.BASE,
        amount="1",
        destination_chain=models.Chain.ARBITRUM,
        gas_sponsorship=False,
    )

    print(f"Bridge ID: {burn_response.bridge_id}")
# SNIPPET END 3

# SNIPPET START 4
    # Sign and broadcast burn transaction
    burn_tx_dict = burn_response.model_dump(by_alias=True)["transaction"]
    signed_burn_tx = base_w3.eth.account.sign_transaction(burn_tx_dict, PRIVATE_KEY)
    burn_tx_hash = base_w3.eth.send_raw_transaction(signed_burn_tx.raw_transaction)

    print(f"Burn tx hash: {base_w3.to_hex(burn_tx_hash)}")
    print(f"View on BaseScan: https://basescan.org/tx/{base_w3.to_hex(burn_tx_hash)}")

    burn_receipt = base_w3.eth.wait_for_transaction_receipt(burn_tx_hash)
    print(f"Burn confirmed in block: {burn_receipt.blockNumber}")
    print("✓ Burn transaction complete!\n")
# SNIPPET END 4

# SNIPPET START 5
    # Step 2: Wait for attestation and prepare mint
    print("Step 2: Waiting for Circle attestation...\n")

    POLL_INTERVAL_SECONDS = 10
    MAX_ATTEMPTS = 60  # 10 minutes max

    mint_response = None
    attempts = 0

    while attempts < MAX_ATTEMPTS:
        attempts += 1
        print(f"Polling for attestation (attempt {attempts}/{MAX_ATTEMPTS})...")

        mint_response = compass_api.bridge.cctp_mint(
            bridge_id=burn_response.bridge_id,
            burn_tx_hash=base_w3.to_hex(burn_tx_hash),
            sender=WALLET_ADDRESS,
        )

        # Check if transaction is ready (has transaction field) or completed
        if hasattr(mint_response, 'transaction') and mint_response.transaction:
            print("Attestation received! Ready to mint.\n")
            break

        # Check response type to determine status
        response_type = type(mint_response).__name__
        if "Completed" in response_type:
            print("Bridge already completed!\n")
            break

        print(f"Status: pending. Waiting {POLL_INTERVAL_SECONDS}s before retry...")
        time.sleep(POLL_INTERVAL_SECONDS)

    if attempts >= MAX_ATTEMPTS:
        raise Exception("Attestation not ready after maximum attempts")
# SNIPPET END 5

# SNIPPET START 6
    # Step 3: Execute mint on Arbitrum (destination chain)
    response_type = type(mint_response).__name__
    if "Completed" not in response_type:
        print("Step 3: Executing mint on Arbitrum...\n")

        mint_tx_dict = mint_response.model_dump(by_alias=True)["transaction"]
        signed_mint_tx = arbitrum_w3.eth.account.sign_transaction(mint_tx_dict, PRIVATE_KEY)
        mint_tx_hash = arbitrum_w3.eth.send_raw_transaction(signed_mint_tx.raw_transaction)

        print(f"Mint tx hash: {arbitrum_w3.to_hex(mint_tx_hash)}")
        print(f"View on Arbiscan: https://arbiscan.io/tx/{arbitrum_w3.to_hex(mint_tx_hash)}")

        mint_receipt = arbitrum_w3.eth.wait_for_transaction_receipt(mint_tx_hash)
        print(f"Mint confirmed in block: {mint_receipt.blockNumber}")
        print("✓ Mint transaction complete!\n")
# SNIPPET END 6

    print("=== Bridge Complete ===")
    print(f"Successfully bridged USDC from Base to Arbitrum")
    print(f"Bridge ID: {burn_response.bridge_id}")
