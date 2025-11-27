// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});
// SNIPPET END 1

// SNIPPET START 2
async function run() {
  // Top vault sorted by 30-day net annualized APY (after fees)
  const result = await compassApiSDK.earn.earnVaults({
    orderBy: "one_month_cagr_net",
    direction: "desc",
    offset: 0,
    limit: 1,
    chain: "ethereum",
  });
  const vault = result.vaults[0];
  const apy = vault.oneMonthCagrNet
    ? (Number(vault.oneMonthCagrNet) * 100).toFixed(2)
    : "N/A";
  console.log(`${vault.name}: ${apy}% (30 day annualized return)`);
}

run();
// SNIPPET END 2
