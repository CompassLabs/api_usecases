import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const compass = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY as string,
});

async function test() {
  // Test with snake_case (what we're using)
  console.log("=== Testing with orderBy: 'one_month_cagr_net' ===");
  const resp1 = await compass.earn.earnVaults({
    chain: "base",
    orderBy: "one_month_cagr_net",
    direction: "desc",
    limit: 3,
  });
  console.log("Results:");
  resp1.vaults.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name}: ${(Number(v.oneMonthCagrNet) * 100).toFixed(2)}%`);
  });
  
  // Test with camelCase (what TypeScript might expect)
  console.log("\n=== Testing with orderBy: 'oneMonthCagrNet' ===");
  try {
    const resp2 = await compass.earn.earnVaults({
      chain: "base",
      orderBy: "oneMonthCagrNet",
      direction: "desc",
      limit: 3,
    });
    console.log("Results:");
    resp2.vaults.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.name}: ${(Number(v.oneMonthCagrNet) * 100).toFixed(2)}%`);
    });
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();
