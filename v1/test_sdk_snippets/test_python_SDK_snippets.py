import os
import requests
from dotenv import load_dotenv
from typing import List, Dict

def load_api_key() -> str:
    """Load and validate the COMPASS_API_KEY from environment."""
    load_dotenv()
    key = os.getenv("COMPASS_API_KEY")
    if not key:
        raise RuntimeError("COMPASS_API_KEY not set in environment")
    return key

def fetch_api_spec(url: str) -> Dict:
    """Fetch the API spec and return the parsed JSON."""
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()

def get_python_code(path: str, spec: Dict) -> str:
    """Return the first Python code sample for a given path."""
    for method in ("get", "post"):
        samples = spec["paths"][path].get(method, {}).get("x-codeSamples")
        if samples:
            return samples[0]["source"]
    raise ValueError(f"No Python code sample found for path: {path!r}")

def replace_with_secret(snippet: str, api_key: str) -> str:
    """Inject the real API key into a code snippet."""
    return snippet.replace("<YOUR_API_KEY_HERE>", api_key)

def filter_paths(all_paths: List[str], broken: List[str]) -> List[str]:
    """Remove any broken paths in one go."""
    broken_set = set(broken)
    return [p for p in all_paths if p not in broken_set]

def main():
    API_URL = "https://spec.speakeasy.com/compasslabs/api/compass-api-with-code-samples"
    BROKEN = [
        "/v0/aave/supply",
        "/v0/aave/borrow",
        "/v0/aave/repay",
        "/v0/aave/withdraw",
        "/v0/aave/historical_transactions/get",
        "/v0/aerodrome_slipstream/swap/sell_exactly",
        "/v0/aerodrome_slipstream/swap/buy_exactly",
        "/v0/aerodrome_slipstream/liquidity_provision/mint",
        # "/v0/aerodrome_slipstream/liquidity_provision/increase",
        # "/v0/aerodrome_slipstream/liquidity_provision/withdraw",
        # "/v0/morpho/markets",
        # "/v0/morpho/allowance",
        # "/v0/morpho/deposit",
        # "/v0/morpho/withdraw",
        # "/v0/morpho/supply_collateral",
        # "/v0/morpho/withdraw_collateral",
        # "/v0/morpho/borrow",
        # "/v0/morpho/repay",
        # "/v0/morpho/vault",
        # "/v0/morpho/vaults",
        # "/v0/morpho/user_position",
        # "/v0/sky/buy",
        # "/v0/sky/sell",
        # "/v0/sky/deposit",
        # "/v0/sky/withdraw",
        # "/v0/token/balance/get",
        # "/v0/token/transfer",
        # "/v0/token/price/get",
        # "/v0/uniswap/quote/buy_exactly/get",
        # "/v0/uniswap/quote/sell_exactly/get",
        # "/v0/uniswap/swap/buy_exactly",
        # "/v0/uniswap/swap/sell_exactly",
        # "/v0/uniswap/liquidity_provision/increase",
        # "/v0/uniswap/liquidity_provision/mint",
        # "/v0/uniswap/liquidity_provision/withdraw",
        # "/v0/generic/portfolio/get",
        # "/v0/generic/visualize_portfolio/get",
        # "/v0/generic/wrap_eth",
        # "/v0/generic/unwrap_weth",
        # "/v0/generic/allowance/set",
        # "/v0/pendle/buy_pt",
        # "/v0/pendle/sell_pt",
        # "/v0/pendle/buy_yt",
        # "/v0/pendle/sell_yt",
        # "/v0/pendle/redeem_yield",
        # "/v0/pendle/add_liquidity",
        # "/v0/pendle/remove_liquidity",
    ]

    api_key = load_api_key()
    spec = fetch_api_spec(API_URL)

    all_paths = list(spec.get("paths", {}))
    new_broken = []

    for path in all_paths:
        print(f"----------------\nendpoint: {path}")
        try:
            code = get_python_code(path, spec)
            exec(replace_with_secret(code, api_key))
        except Exception as e:
            print(f"❌ Failed: {path} – {e}")
            new_broken.append(path)

    print("\nFailed paths:")
    for path in new_broken:
        print(f"- {path}")
    #good_paths = filter_paths(all_paths, BROKEN)

    # for path in good_paths:
    #     print(f"----------------\n"
    #           f"endpoint: {path}")
    #     code = get_python_code(path, spec)
    #     exec(replace_with_secret(code, api_key))

if __name__ == "__main__":

    main()