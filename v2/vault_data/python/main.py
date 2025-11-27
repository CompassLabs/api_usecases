from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
if not COMPASS_API_KEY:
    raise RuntimeError("COMPASS_API_KEY is not set")

TOP_N = 3

with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
    response = compass_api.earn.earn_vaults(
        chain=models.V2EarnVaultsChain.BASE,
        order_by="one_month_cagr_net",
        direction=models.Direction.ASC,
        limit=50,
    )

    vaults = []
    for vault in response.vaults:
        if vault.one_month_cagr_net is None:
            continue
        value = float(vault.one_month_cagr_net)
        vaults.append((value, vault))
        if len(vaults) == TOP_N:
            break

    if not vaults:
        print("No vaults with one_month_cagr_net found")
    else:
        print("Top {n} vaults on Base by one_month_cagr_net (ascending)".format(n=len(vaults)))
        for value, vault in vaults:
            percent = value * 100
            print(f"- {vault.name} ({vault.protocol}): {percent:.2f}% one_month_cagr_net")
