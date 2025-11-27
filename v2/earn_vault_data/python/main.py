# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")

with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
# SNIPPET END 1

# SNIPPET START 2
    # Top vault sorted by 30-day net annualized APY (after fees)
    res = compass_api.earn.earn_vaults(
        order_by="one_month_cagr_net",
        chain=models.V2EarnVaultsChain.ETHEREUM,
        direction=models.Direction.DESC,
        offset=0,
        limit=1,
    )
    vault = res.vaults[0]
    print(f"{vault.name}: {float(vault.one_month_cagr_net) * 100:.2f}% (30 day annualized return)")
# SNIPPET END 2