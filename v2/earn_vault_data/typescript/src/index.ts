// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});
// SNIPPET END 2

// SNIPPET START 3
// Get top vault sorted by 30-day annualized net return (after fees), high to low
const vaultsResponse = await compass.earn.earnVaults({
  chain: "base",
  orderBy: "one_month_cagr_net",
  direction: "desc",
  limit: 1,
});

vaultsResponse.vaults.forEach((vault, index) => {
  const apy = vault.oneMonthCagrNet
    ? `${(Number(vault.oneMonthCagrNet) * 100).toFixed(2)}%`
    : "N/A";
  console.log(`${index + 1}. ${vault.name}: ${apy}`);
});
// SNIPPET END 3
