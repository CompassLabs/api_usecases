import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const compass = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY as string,
});

async function test() {
  const resp = await compass.earn.earnVaults({
    chain: "base",
    orderBy: "one_month_cagr_net",
    direction: "desc",
    limit: 3,
  });

  console.log("TypeScript - Checking if orderBy is working:");
  console.log(`Total vaults returned: ${resp.vaults.length}`);
  console.log("Vaults in order:");
  resp.vaults.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name}: ${(Number(v.oneMonthCagrNet) * 100).toFixed(2)}%`);
  });
  // Check if they're actually sorted
  const values = resp.vaults.map(v => Number(v.oneMonthCagrNet));
  console.log(`APY values: ${values}`);
  const isDescending = JSON.stringify(values) === JSON.stringify([...values].sort((a, b) => b - a));
  console.log(`Is descending? ${isDescending}`);
}

test();
