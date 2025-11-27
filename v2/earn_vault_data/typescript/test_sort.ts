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
    limit: 5,
  });
  
  console.log("TypeScript - Top 5 by oneMonthCagrNet:");
  resp.vaults.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name}: ${(Number(v.oneMonthCagrNet) * 100).toFixed(2)}%`);
  });
  
  const values = resp.vaults.map(v => Number(v.oneMonthCagrNet));
  console.log(`Values: [${values.join(", ")}]`);
  const isDesc = JSON.stringify(values) === JSON.stringify([...values].sort((a, b) => b - a));
  console.log(`Is descending? ${isDesc}`);
}

test();
