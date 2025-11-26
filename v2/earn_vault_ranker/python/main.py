# SNIPPET START 1
# Import Libraries & Environment Variables
from compass_api_sdk import CompassAPI, models
import os
from dotenv import load_dotenv

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
# SNIPPET END 1

# SNIPPET START 2
# Initialize Compass SDK
compass = CompassAPI(api_key_auth=COMPASS_API_KEY)
# SNIPPET END 2

# SNIPPET START 3
# Get top 3 vaults sorted by 30d Net APY (after fees) high to low
with CompassAPI(api_key_auth=COMPASS_API_KEY) as compass_api:
    # Fetch vaults ordered by 30d Net APY (one_month_cagr_net) descending
    vaults_response = compass_api.earn.earn_vaults(
        chain=models.Chain.BASE,
        order_by="one_month_cagr_net",
        direction=models.Direction.DESC,
        offset=0,
        limit=3,
    )

    print("Top 3 Vaults by 30d Net APY (after fees):\n")
    
    for i, vault in enumerate(vaults_response.vaults, 1):
        # Format APY values as percentages
        one_month_apy = (
            f"{float(vault.one_month_cagr_net) * 100:.2f}%"
            if vault.one_month_cagr_net
            else "N/A"
        )
        three_month_apy = (
            f"{float(vault.three_months_cagr_net) * 100:.2f}%"
            if vault.three_months_cagr_net
            else "N/A"
        )
        sharpe_ratio = (
            f"{float(vault.three_months_sharpe_net):.2f}"
            if vault.three_months_sharpe_net
            else "N/A"
        )
        tvl = (
            f"{float(vault.current_nav):,.2f} {vault.denomination}"
            if vault.current_nav
            else "N/A"
        )

        print(f"{i}. {vault.name}")
        print(f"   Protocol: {vault.protocol}")
        print(f"   Vault Address: {vault.address}")
        print(f"   30d Net APY (after fees): {one_month_apy}")
        print(f"   3m Net APY (after fees): {three_month_apy}")
        print(f"   3m Sharpe Ratio: {sharpe_ratio}")
        print(f"   Denomination: {vault.denomination}")
        print(f"   TVL: {tvl}")
        print()
# SNIPPET END 3
