from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration
from fireblocks.base_path import BasePath
from fireblocks.models.create_vault_account_request import CreateVaultAccountRequest
from pprint import pprint
import os
from devtools import debug
from dotenv import load_dotenv

load_dotenv()  # take environment variables
FIREBLOCKS_SECRET_KEY = os.getenv("FIREBLOCKS_SECRET_KEY")
FIREBLOCKS_API_KEY = os.getenv("FIREBLOCKS_API_KEY")
FIREBLOCKS_BASE_PATH = os.getenv("FIREBLOCKS_BASE_PATH")

my_api_key = FIREBLOCKS_API_KEY
with open("secret_key_file_path.txt", "r") as file:
    secret_key_value = file.read()


configuration = ClientConfiguration(
    api_key=my_api_key, secret_key=secret_key_value, base_path=BasePath.Sandbox
)

with Fireblocks(configuration) as fireblocks:
    create_vault_account_request: CreateVaultAccountRequest = CreateVaultAccountRequest(
        name="WALLET_CREATED_BY_PYTHON_SDK", hidden_on_ui=False, auto_fuel=False
    )
    try:
        # Create a new vault account
        future = fireblocks.vaults.create_vault_account(
            create_vault_account_request=create_vault_account_request
        )
        api_response = future.result()  # Wait for the response
        print("The response of VaultsApi->create_vault_account:\n")
        pprint(api_response.data.to_json())
    except Exception as e:
        print("Exception when calling VaultsApi->create_vault_account: %s\n" % e)
