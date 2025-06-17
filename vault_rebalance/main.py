import os
import time
from decimal import Decimal

import streamlit as st
from dotenv import load_dotenv
from web3 import Web3, HTTPProvider
from web3.types import RPCEndpoint

from compass_api_sdk import CompassAPI
from compass_api_sdk.models import (
    Chain,
    TokenEnum,
    TokenBalanceChain,
    MorphoDepositRequestChain,
    MorphoWithdrawRequestChain,
    MorphoSetVaultAllowanceRequestChain,
    MorphoVaultPositionChain,
)

load_dotenv()

# Setup Compass API and Web3
compass = CompassAPI(
    api_key_auth=os.environ.get("COMPASS_KEY"),
    server_url='http://0.0.0.0:80',
)

WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"
w3 = Web3(HTTPProvider("http://127.0.0.1:8545"))
w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(RPCEndpoint("anvil_setBalance"), [WALLET, "0x56BC75E2D63100000"])  # 100 ETH

usdc_vaults = [
    "0x341193ED21711472e71aECa4A942123452bd0ddA",  # Re7 USDC Core
    "0x4F460bb11cf958606C69A963B4A17f9DaEEea8b6",  # f(x) Protocol Re7 USDC
    "0x64964E162Aa18d32f91eA5B24a09529f811AEB8e",  # Re7, USDC Prime
]


# SNIPPET 1 START
def withdraw_tx(vault: str) -> dict:
    res = compass.morpho.withdraw(
        vault_address=vault,
        amount='ALL',
        chain=MorphoWithdrawRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80'
    )
    return res.model_dump(by_alias=True)


def set_allowance_tx(vault: str, allowance: Decimal) -> dict:
    res = compass.morpho.allowance(
        vault_address=vault,
        amount=allowance,
        chain=MorphoSetVaultAllowanceRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80',
    )
    return res.model_dump(by_alias=True)


def deposit_tx(vault: str, amount: Decimal) -> dict:
    res = compass.morpho.deposit(
        vault_address=vault,
        amount=amount,
        chain=MorphoDepositRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80'
    )
    return res.model_dump(by_alias=True)


def get_balance() -> Decimal:
    res = compass.token.balance(
        chain=TokenBalanceChain.ETHEREUM_MAINNET,
        user=WALLET,
        token=TokenEnum.USDC,
        server_url='http://0.0.0.0:80'
    )
    return Decimal(res.amount)
# SNIPPET 1 END

# Streamlit Setup
st.set_page_config(layout="wide")

st.markdown('''
<style>
.st-ha {
    width: 90%;
}
</style>''', unsafe_allow_html=True)

address = st.text_input(
    label="Choose the deposit address",
    value=WALLET,
)

chain = st.selectbox(
    label="Chain", options=[Chain.ETHEREUM_MAINNET], index=0
)

address2vault = {
    vault.address: vault for vault in compass.morpho.vaults().vaults
}

user_positions = [
    compass.morpho.vault_position(
        chain=MorphoVaultPositionChain.ETHEREUM_MAINNET,
        user_address=WALLET,
        vault_address=vault,
        server_url='http://0.0.0.0:80'
    ) for vault in usdc_vaults
]

user_vaults = [
    compass.morpho.vault(
        chain=MorphoVaultPositionChain.ETHEREUM_MAINNET,
        vault_address=vault,
        server_url='http://0.0.0.0:80'
    ) for vault in usdc_vaults
]


@st.dialog("Submit transaction", width="large")
def submit(user_vaults, address2vault, user_positions, target_percentages: list[int]):
    st.markdown('''
    <style>
    div[data-testid="stModal"] div[role="dialog"] {
        width: 80%;
    }
    </style>''', unsafe_allow_html=True)

    cols = st.columns(3)

    with cols[0]:
        st.markdown("# Withdrawing")
        for vault, position in zip(user_vaults, user_positions):
            with st.expander(label=f"Withdrawing from vault {address2vault[vault].symbol}"):
                tx = withdraw_tx(vault)
                st.json(tx)
            with st.spinner("Sign and submit"):
                w3.eth.send_transaction(tx)
                time.sleep(4)

    with cols[1]:
        st.markdown("# Allowances")
        wallet_quantity = get_balance()
        for vault in user_vaults:
            with st.expander(label=f"Setting new allowance on vault {address2vault[vault].symbol}"):
                tx = set_allowance_tx(vault, wallet_quantity)
                st.json(tx)
            with st.spinner("Sign and submit"):
                w3.eth.send_transaction(tx)
                time.sleep(4)

    with cols[2]:
        st.markdown("# Re-depositing")
        # with st.spinner("Waiting for confirmations ..."):
        #     time.sleep(10)

        wallet_quantity = get_balance()
        for vault, target_percentage in zip(user_vaults, target_percentages):
            target = wallet_quantity * Decimal(target_percentage) / Decimal(100)
            with st.expander(label=f"Supplying {target} to {address2vault[vault].symbol}"):
                tx = deposit_tx(vault, target)
                st.json(tx)
            with st.spinner("Sign and submit"):
                w3.eth.send_transaction(tx)
                time.sleep(4)

    st.rerun()


st.title("Vault rebalance demo")
st.text("Demoing rebalancing USDC over several vaults.\n"
        "We are assuming all deposits are made from the same address, but that could easily be changed.")

cols = st.columns(3)

with cols[0]:
    st.subheader("Current State")
    for position, vault in zip(user_positions, user_vaults):
        c = st.container(border=True, height=200)
        c.markdown(f"#### {vault.name}")
        c.text(vault.symbol)
        c.markdown(f"{position.token_amount} USDC")
        subcols = c.columns(3)
        subcols[0].markdown(f"{round(float(vault.state.daily_apy) * 100, 2)}% daily")
        subcols[1].markdown(f"{round(float(vault.state.weekly_apy) * 100, 2)}% weekly")
        subcols[2].markdown(f"{round(float(vault.state.monthly_apy) * 100, 2)}% monthly")

    c = st.container(border=True, height=200)
    c.markdown("#### Wallet")
    c.markdown(f"{get_balance()} USDC")

with cols[1]:
    st.subheader("Target Distribution")
    sliders = []
    for vault in user_vaults:
        c = st.container(border=True, height=200)
        c.markdown(f"#### {vault.name}")
        value = c.slider(
            key=f"slider_{vault.symbol}",
            label="Choose percentage",
            value=20,
        )
        sliders.append(value)

    if sum(sliders) != 100:
        st.text(sliders)
        st.warning("Rebalance percentages need to add up to 100%")
    else:
        st.success("This is a success message!", icon="✅")
        if st.button("Rebalance"):
            st.text(sliders)
            submit(
                user_vaults=usdc_vaults,
                address2vault=address2vault,
                user_positions=user_positions,
                target_percentages=sliders
            )
            st.text("Here's the single transaction to rebalance all positions.\n"
                    "Sign this transaction with the wallet of your choice and then submit to chain.")
with cols[2]:

    st.subheader("Compass SDK code")
    t=open('./main.py','r').read()
    code=t.split('SNIPPET 1 START')[1].split('SNIPPET 1 END')[0]
    st.code(code)

