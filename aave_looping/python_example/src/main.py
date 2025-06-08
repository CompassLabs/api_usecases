from compass_api_sdk import CompassApiSDK
import os
import dotenv
from web3 import Web3
from eth_account import Account

dotenv.load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RPC_URL = os.getenv("RPC_URL")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")

def main():
    sdk = CompassApiSDK(api_key=COMPASS_API_KEY)
    
    private_key = PRIVATE_KEY
    if not private_key.startswith("0x"):
        private_key = f"0x{private_key}"
    
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    account = Account.from_key(private_key)
    
    auth = sdk.transaction_batching.authorization(
        chain="ethereum:mainnet",
        sender=account.address
    )
    
    signed_auth = Account.sign_authorization(auth, private_key)
    
    looping_tx = sdk.transaction_batching.aave_loop(
        chain="ethereum:mainnet",
        sender=account.address,
        signed_authorization=signed_auth.model_dump(),
        collateral_token="USDC",
        borrow_token="WETH",
        initial_collateral_amount=10,
        multiplier=2.0,
        max_slippage_percent=1,
        loan_to_value=80
    )
    
    signed_tx = w3.eth.account.sign_transaction(looping_tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"Transaction hash: {tx_hash.hex()}")

if __name__ == "__main__":
    main()