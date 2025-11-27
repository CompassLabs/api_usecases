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

  console.log("=== TYPESCRIPT RAW OUTPUT ===");
  resp.vaults.forEach((v, i) => {
    console.log(`${i + 1}. Name: ${v.name}`);
    console.log(`   oneMonthCagrNet: ${v.oneMonthCagrNet} (type: ${typeof v.oneMonthCagrNet})`);
    console.log(`   Calculated: ${(Number(v.oneMonthCagrNet) * 100).toFixed(2)}%`);
    console.log();
  });
}

test();
