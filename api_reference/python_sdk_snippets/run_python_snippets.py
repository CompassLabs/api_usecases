import requests


from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.environ.get("COMPASS_API_KEY")
print(api_key)

url = "https://spec.speakeasy.com/compasslabs/api/compass-api-with-code-samples"
response = requests.get(url)

# Raise an error if the request failed
response.raise_for_status()

# Parse JSON
data = response.json()


paths: list = list(data['paths'].keys())


def get_python_code(path: str) -> str:

    methods = ["get", "post"]
    for method in methods:
        method_data = data["paths"][path].get(method)
        if method_data and "x-codeSamples" in method_data:
            return method_data["x-codeSamples"][0]["source"]
    raise ValueError(f"No Python code sample found for path: {path}")


#print('here')
#print(get_python_code(paths[0]))


def replace_with_secret(python_snippet: str, api_key: str | None) -> str | None:

    if api_key is not None:
        code_str = python_snippet.replace("<YOUR_API_KEY_HERE>", api_key)
        return code_str
    pass

#print('there')
out1 = replace_with_secret(python_snippet = get_python_code(paths[0]), api_key=api_key)
print(out1)


broken = [
    '/v0/aave/supply',
    '/v0/aave/borrow',
    '/v0/aave/repay',
    '/v0/aave/withdraw',
    '/v0/aerodrome_slipstream/swap/sell_exactly',
    '/v0/aerodrome_slipstream/swap/buy_exactly',
    '/v0/aerodrome_slipstream/liquidity_provision/mint',
    '/v0/aerodrome_slipstream/liquidity_provision/increase',
    '/v0/aerodrome_slipstream/liquidity_provision/withdraw',
    '/v0/morpho/markets',
    '/v0/morpho/allowance',
    '/v0/morpho/deposit',
    '/v0/morpho/withdraw',
    '/v0/morpho/supply_collateral',
    '/v0/morpho/withdraw_collateral',
    '/v0/morpho/borrow',
    '/v0/morpho/repay',
    '/v0/sky/buy',
    '/v0/sky/sell',
    '/v0/sky/deposit',
    '/v0/sky/withdraw',
    '/v0/token/balance/get',
    '/v0/token/transfer',
    '/v0/uniswap/quote/buy_exactly/get',
    '/v0/uniswap/quote/sell_exactly/get',
    '/v0/uniswap/swap/buy_exactly',
    '/v0/uniswap/swap/sell_exactly',
    '/v0/uniswap/liquidity_provision/increase',
    '/v0/uniswap/liquidity_provision/mint',
    '/v0/uniswap/liquidity_provision/withdraw',
    '/v0/generic/portfolio/get',
    '/v0/generic/visualize_portfolio/get',
    '/v0/generic/wrap_eth',
    '/v0/generic/unwrap_weth',
    '/v0/generic/allowance/set',
    '/v0/pendle/buy_pt',
    '/v0/pendle/sell_pt',
    '/v0/pendle/buy_yt',
    '/v0/pendle/sell_yt',
    '/v0/pendle/redeem_yield',
    '/v0/pendle/add_liquidity',
    '/v0/pendle/remove_liquidity'
]

for b in broken:
    paths.remove(b)

print(paths)
for p in paths:
    print(f"-----\n{p}")
    out2 = replace_with_secret(python_snippet = get_python_code(p), api_key=api_key)
    exec(out2)


