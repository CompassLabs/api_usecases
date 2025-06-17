from compass_api_sdk import CompassAPI
import os
import dotenv
from web3 import Web3
from eth_account import Account

# SNIPPET START 21
dotenv.load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RPC_URL = os.getenv("RPC_URL")
WALLET_ADDRESS = Account.from_key(PRIVATE_KEY).address
# SNIPPET END 21

# SNIPPET START 20
compass_api_sdk = CompassAPI(api_key_auth=os.getenv("COMPASS_API_KEY"))

w3 = Web3(Web3.HTTPProvider(RPC_URL))
# SNIPPET END 20

# SNIPPET START 1
markets_response = compass_api_sdk.pendle.markets(
    chain="arbitrum:mainnet",
)
# SNIPPET END 1

# SNIPPET START 2
market = markets_response.markets.markets[0]
# SNIPPET END 2

# SNIPPET START 3
market_address = market.address
underlying_asset_address = market.underlying_asset.split("-")[1]
pt_address = market.pt.split("-")[1]
yt_address = market.yt.split("-")[1]
# SNIPPET END 3

# SNIPPET START 4
user_position = compass_api_sdk.pendle.position(
    chain="arbitrum:mainnet",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 4

# SNIPPET START 5
underlying_asset_allowance = compass_api_sdk.universal.allowance(
    chain="arbitrum:mainnet",
    user=WALLET_ADDRESS,
    token=underlying_asset_address,
    contract_name="PendleRouter",
)

if underlying_asset_allowance.amount < user_position.underlying_token_balance:
    set_allowance_tx = compass_api_sdk.universal.allowance_set(
        chain="arbitrum:mainnet",
        sender=WALLET_ADDRESS,
        token=underlying_asset_address,
        contract_name="PendleRouter",
        amount=user_position.underlying_token_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 5

# SNIPPET START 6
buy_pt_tx = compass_api_sdk.pendle.buy_pt(
    chain="arbitrum:mainnet",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    amount=user_position.underlying_token_balance,
    max_slippage_percent=0.1,
)

signed_tx = w3.eth.account.sign_transaction(buy_pt_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 6

# SNIPPET START 7
user_position = compass_api_sdk.pendle.position(
    chain="arbitrum:mainnet",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 7

# SNIPPET START 8
pt_allowance = compass_api_sdk.universal.allowance(
    chain="arbitrum:mainnet",
    user=WALLET_ADDRESS,
    token=pt_address,
    contract_name="PendleRouter",
)

if pt_allowance.amount < user_position.pt_balance:
    set_allowance_tx = compass_api_sdk.universal.allowance_set(
        chain="arbitrum:mainnet",
        sender=WALLET_ADDRESS,
        token=pt_address,
        contract_name="PendleRouter",
        amount=user_position.pt_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 8

# SNIPPET START 9
sell_pt_tx = compass_api_sdk.pendle.sell_pt(
    chain="arbitrum:mainnet",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    amount=user_position.pt_balance,
    max_slippage_percent=0.1,
)

signed_tx = w3.eth.account.sign_transaction(sell_pt_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 9

# SNIPPET START 10
user_position = compass_api_sdk.pendle.position(
    chain="arbitrum:mainnet",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 10

# SNIPPET START 11
underlying_asset_allowance = compass_api_sdk.universal.allowance(
    chain="arbitrum:mainnet",
    user=WALLET_ADDRESS,
    token=underlying_asset_address,
    contract_name="PendleRouter",
)

if underlying_asset_allowance.amount < user_position.underlying_token_balance:
    set_allowance_tx = compass_api_sdk.universal.allowance_set(
        chain="arbitrum:mainnet",
        sender=WALLET_ADDRESS,
        token=underlying_asset_address,
        contract_name="PendleRouter",
        amount=user_position.underlying_token_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 11

# SNIPPET START 12
buy_yt_tx = compass_api_sdk.pendle.buy_yt(
    chain="arbitrum:mainnet",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    amount=user_position.underlying_token_balance,
    max_slippage_percent=0.1,
)

signed_tx = w3.eth.account.sign_transaction(buy_yt_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 12

# SNIPPET START 13
redeem_yield_tx = compass_api_sdk.pendle.redeem_yield(
    chain="arbitrum:mainnet",
    sender=WALLET_ADDRESS,
    market_address=market_address,
)

signed_tx = w3.eth.account.sign_transaction(redeem_yield_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 13

# SNIPPET START 14
user_position = compass_api_sdk.pendle.position(
    chain="arbitrum:mainnet",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 14

# SNIPPET START 15
yt_allowance = compass_api_sdk.universal.allowance(
    chain="arbitrum:mainnet",
    user=WALLET_ADDRESS,
    token=yt_address,
    contract_name="PendleRouter",
)

if yt_allowance.amount < user_position.yt_balance:
    set_allowance_tx = compass_api_sdk.universal.allowance_set(
        chain="arbitrum:mainnet",
        sender=WALLET_ADDRESS,
        token=yt_address,
        contract_name="PendleRouter",
        amount=user_position.yt_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 15

# SNIPPET START 16
sell_yt_tx = compass_api_sdk.pendle.sell_yt(
    chain="arbitrum:mainnet",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    amount=user_position.yt_balance,
    max_slippage_percent=0.1,
)

signed_tx = w3.eth.account.sign_transaction(sell_yt_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 16

# SNIPPET START 17
user_position = compass_api_sdk.pendle.position(
    chain="arbitrum:mainnet",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 17

# SNIPPET START 18
underlying_asset_allowance = compass_api_sdk.universal.allowance(
    chain="arbitrum:mainnet",
    user=WALLET_ADDRESS,
    token=underlying_asset_address,
    contract_name="PendleRouter",
)

if underlying_asset_allowance.amount < user_position.underlying_token_balance:
    set_allowance_tx = compass_api_sdk.universal.allowance_set(
        chain="arbitrum:mainnet",
        sender=WALLET_ADDRESS,
        token=underlying_asset_address,
        contract_name="PendleRouter",
        amount=user_position.underlying_token_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 18

# SNIPPET START 19
add_liquidity_tx = compass_api_sdk.pendle.add_liquidity(
    chain="arbitrum:mainnet",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    amount=user_position.underlying_token_balance,
    max_slippage_percent=0.1,
)

signed_tx = w3.eth.account.sign_transaction(add_liquidity_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 19
