import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY;

if (!COMPASS_API_KEY) {
  throw new Error("COMPASS_API_KEY is not set");
}

const TOP_N = 3;

const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});

const response = await compass.earn.earnVaults({
  chain: "base",
  orderBy: "one_month_cagr_net",
  direction: "asc",
  limit: 50,
});

const vaults = response.vaults
  .filter((vault) => vault.oneMonthCagrNet !== undefined && vault.oneMonthCagrNet !== null)
  .slice(0, TOP_N);

if (vaults.length === 0) {
  console.log("No vaults with oneMonthCagrNet available");
} else {
  console.log(`Top ${vaults.length} vaults on Base by one_month_cagr_net (ascending)`);
  for (const vault of vaults) {
    const value = Number(vault.oneMonthCagrNet) * 100;
    console.log(`- ${vault.name} (${vault.protocol}): ${value.toFixed(2)}% one_month_cagr_net`);
  }
}
