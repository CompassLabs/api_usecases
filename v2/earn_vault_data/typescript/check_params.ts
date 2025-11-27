import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const compass = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY as string,
});

async function check() {
  const resp = await compass.earn.earnVaults({
    chain: "base",
    orderBy: "one_month_cagr_net",
    direction: "desc",
    limit: 1,
  });
  
  console.log("TypeScript parameters:");
  console.log("  chain: base");
  console.log("  orderBy: one_month_cagr_net");
  console.log("  direction: desc");
  console.log("  limit: 1");
  console.log(`Result: ${resp.vaults[0].name} - ${(Number(resp.vaults[0].oneMonthCagrNet) * 100).toFixed(2)}%`);
}

check();
