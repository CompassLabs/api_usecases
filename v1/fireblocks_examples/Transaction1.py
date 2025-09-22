from dotenv import load_dotenv
from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration
from fireblocks.base_path import BasePath


from fireblocks.models.transaction_request import TransactionRequest
from fireblocks.models.destination_transfer_peer_path import DestinationTransferPeerPath
from fireblocks.models.source_transfer_peer_path import SourceTransferPeerPath
from fireblocks.models.transfer_peer_path_type import TransferPeerPathType
from fireblocks.models.transaction_request_amount import TransactionRequestAmount
from devtools import debug
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
    asset_id="USDC_ETH_TEST5_AN74",
    amount=TransactionRequestAmount("0.005"),
    source=SourceTransferPeerPath(type=TransferPeerPathType.VAULT_ACCOUNT, id="4"),
    destination=DestinationTransferPeerPath(
        type=TransferPeerPathType.VAULT_ACCOUNT, id="3"
    ),
    note="Your first transaction!",
    useGasless=True,
)

debug(transaction_request)
future = fireblocks.transactions.create_transaction(
    transaction_request=transaction_request
)
api_response = future.result()  # Wait for the response
debug(api_response)
