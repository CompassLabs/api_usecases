# SNIPPET START 21
from compass_api_sdk import CompassAPI
import os
import dotenv
from web3 import Web3
from eth_account import Account

dotenv.load_dotenv()

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ARBITRUM_RPC_URL = os.getenv("ARBITRUM_RPC_URL")
WALLET_ADDRESS = Account.from_key(PRIVATE_KEY).address
# SNIPPET END 21

# SNIPPET START 20
compass_api_sdk = CompassAPI(
    api_key_auth=os.getenv("COMPASS_API_KEY"), 
    server_url=os.getenv("SERVER_URL") or None # For internal testing purposes. You do not need to set this.
)

w3 = Web3(Web3.HTTPProvider(ARBITRUM_RPC_URL))
# SNIPPET END 20

# SNIPPET START 1
markets_response = compass_api_sdk.pendle.pendle_markets(
    chain="arbitrum",
)
# SNIPPET END 1

# SNIPPET START 2
selected_market = markets_response.markets[0]
# SNIPPET END 2

# SNIPPET START 3
market_address = selected_market.address
underlying_asset_address = selected_market.underlying_asset.split("-")[1]
pt_address = selected_market.pt.split("-")[1]
yt_address = selected_market.yt.split("-")[1]
# SNIPPET END 3

swap_tx = compass_api_sdk.swap.swap_odos(
    chain="arbitrum",
    sender=WALLET_ADDRESS,
    token_in="ETH",
    token_out="USDC",
    amount=0.1,
    max_slippage_percent=2,
)
signed_tx = w3.eth.account.sign_transaction(swap_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)

# SNIPPET START 5
usdc_allowance = compass_api_sdk.universal.generic_allowance(
    chain="arbitrum",
    user=WALLET_ADDRESS,
    token="USDC",
    contract="PendleRouter",
)

if int(usdc_allowance.amount) < 100:
    # Set new allowance if current USDC allowance for Pendle Router is insufficient
    set_allowance_tx = compass_api_sdk.universal.generic_allowance_set(
        chain="arbitrum",
        sender=WALLET_ADDRESS,
        token="USDC",
        contract="PendleRouter",
        amount=100,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 5

# SNIPPET START 6
buy_pt_tx = compass_api_sdk.pendle.pendle_pt(
    chain="arbitrum",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    action="BUY",
    token="USDC",
    amount_in=100,
    max_slippage_percent=2,
)

signed_tx = w3.eth.account.sign_transaction(buy_pt_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 6

# SNIPPET START 7
market = compass_api_sdk.pendle.pendle_market(
    chain="arbitrum",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 7

# SNIPPET START 8
pt_allowance = compass_api_sdk.universal.generic_allowance(
    chain="arbitrum",
    user=WALLET_ADDRESS,
    token=pt_address,
    contract="PendleRouter",
)

if pt_allowance.amount < market.user_position.pt_balance:
    # Set new allowance if current PT allowance for Pendle Router is insufficient
    set_allowance_tx = compass_api_sdk.universal.generic_allowance_set(
        chain="arbitrum",
        sender=WALLET_ADDRESS,
        token=pt_address,
        contract="PendleRouter",
        amount=market.user_position.pt_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 8

# SNIPPET START 9
sell_pt_tx = compass_api_sdk.pendle.pendle_pt(
    chain="arbitrum",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    action="SELL",
    token=underlying_asset_address,
    amount_in=market.user_position.pt_balance,
    max_slippage_percent=2,
)

signed_tx = w3.eth.account.sign_transaction(sell_pt_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 9

# SNIPPET START 10
market = compass_api_sdk.pendle.pendle_market(
    chain="arbitrum",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 10

# SNIPPET START 11
underlying_asset_allowance = compass_api_sdk.universal.generic_allowance(
    chain="arbitrum",
    user=WALLET_ADDRESS,
    token=underlying_asset_address,
    contract="PendleRouter",
)

if underlying_asset_allowance.amount < market.user_position.underlying_token_balance:
    # Set new allowance if current underlying asset allowance for Pendle Router is insufficient
    set_allowance_tx = compass_api_sdk.universal.generic_allowance_set(
        chain="arbitrum",
        sender=WALLET_ADDRESS,
        token=underlying_asset_address,
        contract="PendleRouter",
        amount=market.user_position.underlying_token_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 11

# SNIPPET START 12
buy_yt_tx = compass_api_sdk.pendle.pendle_yt(
    chain="arbitrum",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    action="BUY",
    token=underlying_asset_address,
    amount_in=market.user_position.underlying_token_balance,
    max_slippage_percent=2,
)

signed_tx = w3.eth.account.sign_transaction(buy_yt_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 12

# SNIPPET START 13
redeem_yield_tx = compass_api_sdk.pendle.pendle_redeem_yield(
    chain="arbitrum",
    sender=WALLET_ADDRESS,
    market_address=market_address,
)

signed_tx = w3.eth.account.sign_transaction(redeem_yield_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 13

# SNIPPET START 14
market = compass_api_sdk.pendle.pendle_market(
    chain="arbitrum",
    user_address=WALLET_ADDRESS,
    market_address=market_address,
)
# SNIPPET END 14

# SNIPPET START 15
yt_allowance = compass_api_sdk.universal.generic_allowance(
    chain="arbitrum",
    user=WALLET_ADDRESS,
    token=yt_address,
    contract="PendleRouter",
)

if yt_allowance.amount < market.user_position.yt_balance:
    # Set new allowance if current YT allowance for Pendle Router is insufficient
    set_allowance_tx = compass_api_sdk.universal.generic_allowance_set(
        chain="arbitrum",
        sender=WALLET_ADDRESS,
        token=yt_address,
        contract="PendleRouter",
        amount=market.user_position.yt_balance,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 15

# SNIPPET START 16
sell_yt_tx = compass_api_sdk.pendle.pendle_yt(
    chain="arbitrum",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    action="SELL",
    token="USDT",
    amount_in=market.user_position.yt_balance,
    max_slippage_percent=2,
)

signed_tx = w3.eth.account.sign_transaction(sell_yt_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 16

# SNIPPET START 17
usdt_balance = compass_api_sdk.token.token_balance(
    chain="arbitrum",
    token="USDT",
    user=WALLET_ADDRESS,
)
# SNIPPET END 17

# SNIPPET START 18
usdt_allowance = compass_api_sdk.universal.generic_allowance(
    chain="arbitrum",
    user=WALLET_ADDRESS,
    token="USDT",
    contract="PendleRouter",
)

if usdt_allowance.amount < usdt_balance.amount:
    # Set new allowance if current USDT allowance for Pendle Router is insufficient
    set_allowance_tx = compass_api_sdk.universal.generic_allowance_set(
        chain="arbitrum",
        sender=WALLET_ADDRESS,
        token="USDT",
        contract="PendleRouter",
        amount=usdt_balance.amount,
    )

    signed_tx = w3.eth.account.sign_transaction(set_allowance_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 18

# SNIPPET START 19
add_liquidity_tx = compass_api_sdk.pendle.pendle_liquidity(
    chain="arbitrum",
    sender=WALLET_ADDRESS,
    market_address=market_address,
    action="SUPPLY",
    token="USDT",
    amount_in=usdt_balance.amount,
    max_slippage_percent=2,
)

signed_tx = w3.eth.account.sign_transaction(add_liquidity_tx.transaction.model_dump(by_alias=True), PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)
# SNIPPET END 19
