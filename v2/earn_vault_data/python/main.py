# SNIPPET START 1
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
# SNIPPET END 1

# SNIPPET START 2
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
# SNIPPET END 2

# SNIPPET START 3
    # Get top vault sorted by 30-day annualized net return (after fees), high to low
    vaults_response = compass_api.earn.earn_vaults(
        chain=models.V2EarnVaultsChain.BASE,
        order_by="one_month_cagr_net",
        direction=models.Direction.DESC,
        limit=1,
    )

    for i, vault in enumerate(vaults_response.vaults, 1):
        print(f"{i}. {vault.name}: {float(vault.one_month_cagr_net) * 100:.2f}%")
    

    