from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration
from fireblocks.base_path import BasePath
from fireblocks.models.transaction_request import TransactionRequest
from fireblocks.models.destination_transfer_peer_path import DestinationTransferPeerPath
from fireblocks.models.source_transfer_peer_path import SourceTransferPeerPath
from fireblocks.models.transfer_peer_path_type import TransferPeerPathType
from fireblocks.models.transaction_request_amount import TransactionRequestAmount
from pprint import pprint
import os
from devtools import debug
from dotenv import load_dotenv

load_dotenv()  # take environment variables
FIREBLOCKS_SECRET_KEY = os.getenv("FIREBLOCKS_SECRET_KEY")
FIREBLOCKS_API_KEY = os.getenv("FIREBLOCKS_API_KEY")
FIREBLOCKS_BASE_PATH = os.getenv("FIREBLOCKS_BASE_PATH")

# load the secret key content from a file
with open("secret_key_file_path.txt", "r") as file:
    secret_key_value = file.read()

# build the configuration
configuration = ClientConfiguration(
    api_key=FIREBLOCKS_API_KEY,
    secret_key=secret_key_value,
    base_path=BasePath.Sandbox,  # or set it directly to a string "https://sandbox-api.fireblocks.io/v1"
)

# Enter a context with an instance of the API client
with Fireblocks(configuration) as fireblocks:
    transaction_request: TransactionRequest = TransactionRequest(
        asset_id="ETH",
        amount=TransactionRequestAmount("0.1"),
        source=SourceTransferPeerPath(type=TransferPeerPathType.VAULT_ACCOUNT, id="0"),
        destination=DestinationTransferPeerPath(
            type=TransferPeerPathType.VAULT_ACCOUNT, id="1"
        ),
        note="Your first transaction!",
    )
    # or you can use JSON approach:
    #
    # transaction_request: TransactionRequest = TransactionRequest.from_json(
    #     '{"note": "Your first transaction!", '
    #     '"assetId": "ETH", '
    #     '"source": {"type": "VAULT_ACCOUNT", "id": "0"}, '
    #     '"destination": {"type": "VAULT_ACCOUNT", "id": "1"}, '
    #     '"amount": "0.1"}'
    # )
    try:
        # Create a new transaction
        future = fireblocks.transactions.create_transaction(
            transaction_request=transaction_request
        )
        api_response = future.result()  # Wait for the response
        print("The response of TransactionsApi->create_transaction:\n")
        pprint(api_response)
        # to print just the data:                pprint(api_response.data)
        # to print just the data in json format: pprint(api_response.data.to_json())
    except Exception as e:
        print("Exception when calling TransactionsApi->create_transaction: %s\n" % e)
