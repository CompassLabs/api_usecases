import time

import streamlit as st
import plotly.graph_objects as go
from decimal import Decimal
from compass_api_sdk import CompassAPI
from compass_api_sdk.models import Chain, TokenBalanceChain, MorphoDepositRequestChain, MorphoSetVaultAllowanceRequestChain, TokenEnum, MorphoWithdrawRequestChain, TokenAddressToken, MorphoVault, MorphoVaultPositionChain
from dotenv import load_dotenv
import os
import json
load_dotenv()


compass: CompassAPI = CompassAPI(
    api_key_auth=os.environ.get("COMPASS_KEY"),
    server_url = 'http://0.0.0.0:80',
)

usdc_vaults = [
    "0x341193ED21711472e71aECa4A942123452bd0ddA",  # Re7 USDC Core
    "0x4F460bb11cf958606C69A963B4A17f9DaEEea8b6",  # f(x) Protocol Re7 USDC
    "0x64964E162Aa18d32f91eA5B24a09529f811AEB8e", # Re7, USDC Prime
]


from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
w3 = Web3(HTTPProvider("http://127.0.0.1:8545")) #ETHEREUM
WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"
w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])
w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)


def withdraw_tx(vault: str) -> dict:
    res = compass.morpho.withdraw(
        vault_address=vault,
        amount='ALL',
        chain=MorphoWithdrawRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80'
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    return unsigned_transaction

def set_allowance_tx(vault: str, allowance: Decimal) -> dict:
    res = compass.morpho.allowance(
        vault_address=vault,
        amount=allowance,
        chain=MorphoSetVaultAllowanceRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    return res.model_dump(by_alias=True)

def deposit_tx(vault: str, amount: Decimal) -> dict:
    res = compass.morpho.deposit(
        vault_address=vault,#'0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1',
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

@st.dialog("Submit transaction" , width="large")
def submit(user_vaults, address2vault, user_positions, target_percentages: list[int]):
    # st.text([Decimal(pos.token_amount) for pos in user_positions])
    st.markdown('''<style>
    div[data-testid="stModal"] div[role="dialog"] {
        width: 80%;
    }
    </style>''', unsafe_allow_html=True)

    cols=st.columns(3)
    total=Decimal('0')
    for pos in user_positions:
        total += Decimal(pos.token_amount)

    with cols[0]:
        st.markdown("# Withdrawing")
        for vault, position in zip(user_vaults, user_positions):
            with st.expander(label=f"Witdrawing from vault {address2vault[vault].symbol}"):
            # st.write(f"Witdrawing from vault {address2vault[vault].symbol}")
                tx = withdraw_tx(vault)
                st.json(tx)
            with st.spinner():
                w3.eth.send_transaction(tx)
                time.sleep(4)

    with cols[1]:
        st.markdown("\n# Allowances")
        wallet_quantity = get_balance()
        for vault, position in zip(user_vaults, user_positions):
            with st.expander(label=f"Setting new allowance on vault {address2vault[vault].symbol}"):
                tx = set_allowance_tx(vault, wallet_quantity)
                st.json(tx)
            with st.spinner():
                w3.eth.send_transaction(tx)
                time.sleep(4)

    with cols[2]:
        st.markdown("# Re-depositing")
        for vault, position, target_percentage in zip(user_vaults, user_positions, target_percentages):
            wallet_quantity=get_balance()
            target=wallet_quantity*Decimal(target_percentage)/Decimal(100)
            with st.expander(label=f"Supplying {target} to {address2vault[vault].symbol}"):
                tx = deposit_tx(vault, target)
                st.json(tx)
            with st.spinner():
                w3.eth.send_transaction(tx)
                time.sleep(4)
    st.rerun()



st.set_page_config(layout="wide")


st.markdown('''<style>
.st-ha {
    width: 90%;
}
</style>''', unsafe_allow_html=True)

address = st.text_input(
    label="Choose the deposit address",
    value="0xa829B388A3DF7f581cE957a95edbe419dd146d1B",
)
chain = st.selectbox(
    label="Chain", options=[Chain.ETHEREUM_MAINNET], index=0
)


address2vault: dict[str, MorphoVault] = {
    vault.address: vault for vault in compass.morpho.vaults().vaults
}


user_positions = [
    compass.morpho.vault_position(
        chain=MorphoVaultPositionChain.ETHEREUM_MAINNET,
        user_address="0xa829B388A3DF7f581cE957a95edbe419dd146d1B",
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

st.text(user_positions)


st.title("Vault rebalance demo")
st.text("""Demoing rebalaning USDC over several vaults.
We are assuming all depoists are made from the same address, but that could easily be changed.
""")


cols = st.columns(3)

with cols[0]:
    st.subheader("Current State")
    for position, vault in zip(user_positions, user_vaults):
        c = st.container(border=True, height=200)
        c.markdown(f"#### {vault.name}")
        c.text(vault.symbol)
        c.markdown(f"{position.token_amount} USDC")
        subcols=c.columns(3)
        with subcols[0]:
            st.markdown(f"{round(float(vault.state.daily_apy)*100,2)}% daily")
        with subcols[1]:
            st.markdown(f"{round(float(vault.state.weekly_apy)*100,2)}% weekly")
        with subcols[2]:
            st.markdown(f"{round(float(vault.state.monthly_apy)*100,2)}% monthly")
    c = st.container(border=True, height=200)
    c.markdown(f"#### Wallet")
    c.markdown(f"{get_balance()} USDC")


    # deposits_arr = [float(pos.token_amount) for pos in user_positions]
    # vault_names = [vault.name for pos in user_vaults]
    # vault_symbol = [vault.asset.name for pos in user_vaults]



with cols[1]:
    st.subheader("Target Distribution")
    sliders = []
    for position, vault in zip(user_positions, user_vaults):
        c = st.container(border=True, height=200)
        c.markdown(f"#### {vault.name}")
        value = c.slider(
            key=f"slider_{vault.symbol}",
            label="Choose percentage",
            value=20,
        )
        sliders.append(value)

    sum = sum(sliders)
    if sum != 100:
        st.text(sliders)
        st.warning("Rebalance percentages need to add up to 100%")
    else:
        st.success("This is a success message!", icon="✅")
        bt1 = st.button("Rebalance")
        if bt1:
            submit(user_vaults=usdc_vaults, address2vault=address2vault, user_positions=user_positions, target_percentages=sliders)
            st.text(
                "Here's the single transaction to rebalance all positions.\nSign this transaction with the wallet of your choice and then submit to chain."
            )

    # with cols[2]:
    #     st.subheader("Batched Transaction")
    #     st.text(
    #         "Below if the full code to make the rebalance happen programticallyusing the comopass SDK"
    #     )
    #
    #     with open("./rebalance.py", "r") as f:
    #         t = f.read()
    #     t = t.split("# CODE START")[1].split("# CODE END")[0]
    #     t = f"target_percentages={[i / 100 for i in sliders]}\n" + t
    #     st.code(t)
