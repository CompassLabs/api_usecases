from dotenv import load_dotenv
from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration
from fireblocks.base_path import BasePath
import os

load_dotenv()  # take environment variables

FIREBLOCKS_SECRET_KEY = os.getenv("FIREBLOCKS_SECRET_KEY")
FIREBLOCKS_API_KEY = os.getenv("FIREBLOCKS_API_KEY")
FIREBLOCKS_BASE_PATH = os.getenv("FIREBLOCKS_BASE_PATH")

# debug([FIREBLOCKS_API_KEY, FIREBLOCKS_BASE_PATH, FIREBLOCKS_SECRET_KEY])


# Enter a context with an instance of the API client
with Fireblocks() as fireblocks:
    pass

# build the configuration
configuration = ClientConfiguration(
    api_key=FIREBLOCKS_API_KEY,
    secret_key=FIREBLOCKS_SECRET_KEY,
    base_path=FIREBLOCKS_BASE_PATH,  # or set it directly to a string "https://sandbox-api.fireblocks.io/v1"
)

# debug(configuration)

from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration

# load the secret key content from a file
with open("secret_key_file_path.txt", "r") as file:
    secret_key_value = file.read()
    # print(secret_key_value)

# build the configuration
configuration = ClientConfiguration(
    api_key=FIREBLOCKS_API_KEY,
    secret_key=secret_key_value,
    base_path=BasePath.Sandbox,  # or set it directly to a string "https://sandbox-api.fireblocks.io/v1"
)

fireblocks = Fireblocks(configuration)


transaction_request: TransactionRequest = TransactionRequest(
    asset_id="ETH",
    amount=TransactionRequestAmount("0.1"),
    source=SourceTransferPeerPath(type=TransferPeerPathType.VAULT_ACCOUNT, id="0"),
    destination=DestinationTransferPeerPath(
        type=TransferPeerPathType.VAULT_ACCOUNT, id="1"
    ),
    note="Your first transaction!",
)
