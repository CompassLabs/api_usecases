import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const compass = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY as string,
});

async function test() {
  // Try with snake_case (what API expects)
  console.log("=== Testing with orderBy: 'one_month_cagr_net' ===");
  const resp1 = await compass.earn.earnVaults({
    chain: "base",
    orderBy: "one_month_cagr_net",
    direction: "desc",
    limit: 3,
  });
  resp1.vaults.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name}: ${(Number(v.oneMonthCagrNet) * 100).toFixed(2)}%`);
  });
  
  // Try with camelCase (what TypeScript SDK might expect)
  console.log("\n=== Testing with orderBy: 'oneMonthCagrNet' ===");
  const resp2 = await compass.earn.earnVaults({
    chain: "base",
    orderBy: "oneMonthCagrNet",
    direction: "desc",
    limit: 3,
  });
  resp2.vaults.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name}: ${(Number(v.oneMonthCagrNet) * 100).toFixed(2)}%`);
  });
}

test();
