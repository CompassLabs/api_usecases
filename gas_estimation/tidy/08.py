"""
Minimal reproduction of the original demo:
• spins up an Anvil‑forked chain
• funds and approves a hot wallet
• executes a series of Compass transactions sequentially
"""

import os
import time
from functools import partial
from typing import Iterable, Tuple, Callable

from dotenv import load_dotenv
from rich.console import Console
from web3 import Web3, HTTPProvider
from web3.types import RPCEndpoint

from compass_api_sdk import CompassAPI, models as m

# ──────────────────────────────
# Configuration
# ──────────────────────────────
SERVER_URL = "http://0.0.0.0:80"
RPC_URL = "http://127.0.0.1:8545"
CHAIN = m.Chain.ETHEREUM_MAINNET
FEE = m.FeeEnum.ZERO_DOT_3  # 0.3 %
WALLET = "0xebba555178005Aae650bd32B7B27FBE2cfEe743d"  # 🚨 ephemeral test key only
INITIAL_BALANCE_ETH = 100
INTEREST_RATE = m.InterestRateMode.VARIABLE
TOKENS = {
    "USDC": m.TokenEnum.USDC,
    "USDT": m.TokenEnum.USDT,
    "WETH": m.TokenEnum.WETH,
}

console = Console(highlight=False)

# ──────────────────────────────
# Bootstrapping
# ──────────────────────────────
load_dotenv()
compass = CompassAPI(api_key_auth=os.getenv("COMPASS_API_KEY"))
w3 = Web3(HTTPProvider(RPC_URL))


def impersonate(wallet: str, eth_amount: int) -> None:
    """Give the fork copies of the desired wallet and balance."""
    w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [wallet])
    w3.provider.make_request(
        RPCEndpoint("anvil_setBalance"),
        [wallet, hex(Web3.to_wei(eth_amount, "ether"))],
    )
    w3.provider.make_request(RPCEndpoint("evm_setAutomine"), [True])


impersonate(WALLET, INITIAL_BALANCE_ETH)


# ──────────────────────────────
# Generic helpers
# ──────────────────────────────
def build_req(obj):  # Compass expects plain kwargs, not Pydantic models.
    d = obj.model_dump(by_alias=True)
    d["server_url"] = SERVER_URL
    d.pop("ACTION_TYPE", None)
    return d


def execute(tx_model) -> int:
    """Send unsigned TX to Anvil, wait, return gas used."""
    unsigned = tx_model.model_dump(by_alias=True)
    gas_est = w3.eth.estimate_gas(unsigned)
    tx_hash = w3.eth.send_transaction(unsigned).hex()
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return gas_est


def pretty(title: str, fn: Callable, *args, **kwargs):
    gas = execute(fn(*args, **kwargs))
    console.print(f"[bold cyan]{title:<25}[/] | gas ≈ {gas}")


# ──────────────────────────────
# Read‑only console helpers
# ──────────────────────────────
def balances():
    bals = {
        sym: compass.token.balance(
            chain=CHAIN, user=WALLET, token=tok, server_url=SERVER_URL
        ).amount
        for sym, tok in TOKENS.items()
    }
    console.print(f"[magenta]Balances[/] {bals}")


def aave_status():
    pos = compass.aave_v3.user_position_summary(
        chain=CHAIN, user=WALLET, server_url=SERVER_URL
    )
    console.print(
        f"[green]Aave[/] collateral={pos.total_collateral} debt={pos.total_debt} "
        f"HF={pos.health_factor}"
    )


# ──────────────────────────────
# One‑off funding & approvals
# ──────────────────────────────
def fund_wallet():
    console.rule("[bold]Funding test wallet")
    pretty(
        "Wrap 10 ETH",
        compass.universal.wrap_eth,
        amount=10,
        chain=CHAIN,
        sender=WALLET,
        server_url=SERVER_URL,
    )

    for out_token in (TOKENS["USDC"], TOKENS["USDT"]):
        pretty(
            f"Buy 2 {out_token.name}",
            compass.uniswap_v3.swap_buy_exactly,
            token_in=TOKENS["WETH"],
            token_out=out_token,
            fee=FEE,
            max_slippage_percent=0.5,
            amount=2,
            wrap_eth=True,
            chain=CHAIN,
            sender=WALLET,
            server_url=SERVER_URL,
        )
    balances()


def approve(token, spender):
    pretty(
        f"Approve {token.name[:4]} for {spender.name.split('_')[0]}",
        compass.universal.allowance_set,
        token=token,
        contract=spender,
        amount="10",
        chain=CHAIN,
        sender=WALLET,
        server_url=SERVER_URL,
    )


def set_allowances():
    approve(TOKENS["USDC"], m.SetAllowanceRequestContractEnum.AAVE_V3_POOL)
    approve(TOKENS["USDT"], m.SetAllowanceRequestContractEnum.AAVE_V3_POOL)
    approve(TOKENS["USDC"], m.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER)
    approve(TOKENS["USDT"], m.SetAllowanceRequestContractEnum.UNISWAP_V3_ROUTER)


# ──────────────────────────────
# Main scripted flow
# ──────────────────────────────
def tx_flow() -> Iterable[Tuple[str, Callable]]:
    return (
        (
            "Supply 2 USDC",
            partial(compass.aave_v3.supply, token=TOKENS["USDC"], amount="2"),
        ),
        (
            "Borrow 1 USDT",
            partial(
                compass.aave_v3.borrow,
                token=TOKENS["USDT"],
                amount="1",
                interest_rate_mode=INTEREST_RATE,
            ),
        ),
        (
            "Repay 1 USDT",
            partial(
                compass.aave_v3.repay,
                token=TOKENS["USDT"],
                amount="1",
                interest_rate_mode=INTEREST_RATE,
            ),
        ),
        (
            "Withdraw 2 USDC",
            partial(
                compass.aave_v3.withdraw,
                token=TOKENS["USDC"],
                amount="2",
                recipient=WALLET,
            ),
        ),
        (
            "Swap 1 USDC→USDT",
            partial(
                compass.uniswap_v3.swap_sell_exactly,
                token_in=TOKENS["USDC"],
                token_out=TOKENS["USDT"],
                fee=FEE,
                amount="1",
                max_slippage_percent="0.2",
            ),
        ),
        (
            "Swap 1 USDT→USDC",
            partial(
                compass.uniswap_v3.swap_sell_exactly,
                token_in=TOKENS["USDT"],
                token_out=TOKENS["USDC"],
                fee=FEE,
                amount="1",
                max_slippage_percent="0.2",
            ),
        ),
    )


def run_sequence():
    console.rule("[bold yellow]Begin scripted run")
    for title, builder in tx_flow():
        pretty(title, builder, chain=CHAIN, sender=WALLET, server_url=SERVER_URL)
        balances()
        aave_status()
        w3.provider.make_request(RPCEndpoint("evm_mine"), [])  # mine next block


# ──────────────────────────────
# Entrypoint
# ──────────────────────────────
if __name__ == "__main__":
    fund_wallet()
    set_allowances()
    run_sequence()
