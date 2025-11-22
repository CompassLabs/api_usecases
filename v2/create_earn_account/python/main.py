# SNIPPET START 1
# Import Libraries & Environment Variables
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")
# SNIPPET END 1

# SNIPPET START 2
# Initialize Compass SDK
compass = CompassAPI(api_key_auth=COMPASS_API_KEY)
# SNIPPET END 2

# SNIPPET START 3
# Create Earn Account (No Gas Sponsorship)
# Get unsigned transaction to create an Earn Account on Base
# owner: The address that will own and control the Earn Account
# sender: The address that will sign and pay for gas (same as owner = no gas sponsorship)
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
    create_account_response = compass_api.earn.earn_create_account(
        chain=models.CreateAccountRequestChain.BASE,
        sender=WALLET_ADDRESS,
        owner=WALLET_ADDRESS,
        estimate_gas=True,
    )

    print("Earn Account Address:", create_account_response.earn_account_address)
    print("Unsigned Transaction:", create_account_response.transaction)
# SNIPPET END 3

