from dotenv import load_dotenv
from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration
from fireblocks.base_path import BasePath
from fireblocks.models.create_vault_account_request import CreateVaultAccountRequest
from pprint import pprint
import os
from devtools import debug

load_dotenv()  # take environment variables
FIREBLOCKS_SECRET_KEY = os.getenv("FIREBLOCKS_SECRET_KEY")
FIREBLOCKS_API_KEY = os.getenv("FIREBLOCKS_API_KEY")
FIREBLOCKS_BASE_PATH = os.getenv("FIREBLOCKS_BASE_PATH")


debug([FIREBLOCKS_API_KEY, FIREBLOCKS_BASE_PATH, FIREBLOCKS_SECRET_KEY])

from fireblocks.client import Fireblocks

# Enter a context with an instance of the API client
with Fireblocks() as fireblocks:
    pass

# build the configuration
configuration = ClientConfiguration(
    api_key=FIREBLOCKS_API_KEY,
    secret_key=FIREBLOCKS_SECRET_KEY,
    base_path=FIREBLOCKS_BASE_PATH,  # or set it directly to a string "https://sandbox-api.fireblocks.io/v1"
)

debug(configuration)


from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration
from fireblocks.base_path import BasePath
from pprint import pprint

# load the secret key content from a file
with open("secret_key_file_path.txt", "r") as file:
    secret_key_value = file.read()
    print(secret_key_value)

# build the configuration
configuration = ClientConfiguration(
    api_key=FIREBLOCKS_API_KEY,
    secret_key=secret_key_value,
    base_path=BasePath.Sandbox,  # or set it directly to a string "https://sandbox-api.fireblocks.io/v1"
)

# Enter a context with an instance of the API client
with Fireblocks(configuration) as fireblocks:
    try:
        # List vault accounts (Paginated)
        future = fireblocks.vaults.get_paged_vault_accounts()
        api_response = future.result()  # Wait for the response
        print("The response of VaultsApi->get_paged_vault_accounts:\n")
        pprint(api_response)
        pprint(api_response.data)
        pprint(api_response.data.to_json())
    except Exception as e:
        print("Exception when calling VaultsApi->get_paged_vault_accounts: %s\n" % e)

fireblocks = Fireblocks(configuration)

addr = fireblocks.get_deposit_address(vault_account_id="0", asset_id="ETH_TEST5")
print(addr)  # fund this from a Sepolia faucet
