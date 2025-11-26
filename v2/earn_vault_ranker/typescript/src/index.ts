// SNIPPET START 1
// Import Libraries & Environment Variables
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
// SNIPPET END 1

// SNIPPET START 2
// Initialize Compass SDK
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});
// SNIPPET END 2

// SNIPPET START 3
// Get top 3 vaults sorted by 30d Net APY (after fees) high to low
async function run() {
  // Fetch vaults ordered by 30d Net APY (one_month_cagr_net) descending
  const vaultsResponse = await compass.earn.earnVaults({
    chain: "base",
    orderBy: "one_month_cagr_net",
    direction: "desc",
    offset: 0,
    limit: 3,
  });

  console.log("Top 3 Vaults by 30d Net APY (after fees):\n");

  vaultsResponse.vaults.forEach((vault, index) => {
    // Format APY values as percentages
    // Note: SDK converts snake_case API fields to camelCase
    const oneMonthAPY = (vault as any).oneMonthCagrNet
      ? `${(parseFloat((vault as any).oneMonthCagrNet) * 100).toFixed(2)}%`
      : "N/A";
    const threeMonthAPY = (vault as any).threeMonthsCagrNet
      ? `${(parseFloat((vault as any).threeMonthsCagrNet) * 100).toFixed(2)}%`
      : "N/A";
    const sharpeRatio = (vault as any).threeMonthsSharpeNet
      ? parseFloat((vault as any).threeMonthsSharpeNet).toFixed(2)
      : "N/A";
    const tvl = (vault as any).currentNav
      ? `${parseFloat((vault as any).currentNav).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${vault.denomination}`
      : "N/A";

    console.log(`${index + 1}. ${vault.name}`);
    console.log(`   Protocol: ${vault.protocol}`);
    console.log(`   Vault Address: ${vault.address}`);
    console.log(`   30d Net APY (after fees): ${oneMonthAPY}`);
    console.log(`   3m Net APY (after fees): ${threeMonthAPY}`);
    console.log(`   3m Sharpe Ratio: ${sharpeRatio}`);
    console.log(`   Denomination: ${vault.denomination}`);
    console.log(`   TVL: ${tvl}`);
    console.log();
  });
}

run();
// SNIPPET END 3
