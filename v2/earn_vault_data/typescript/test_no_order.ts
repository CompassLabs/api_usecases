import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const compass = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY as string,
});

async function test() {
  // Test without orderBy
  const resp1 = await compass.earn.earnVaults({
    chain: "base",
    limit: 1,
  });
  console.log("Without orderBy:", resp1.vaults[0].name, (Number(resp1.vaults[0].oneMonthCagrNet) * 100).toFixed(2) + "%");
  
  // Test with orderBy
  const resp2 = await compass.earn.earnVaults({
    chain: "base",
    orderBy: "one_month_cagr_net",
    direction: "desc",
    limit: 1,
  });
  console.log("With orderBy:", resp2.vaults[0].name, (Number(resp2.vaults[0].oneMonthCagrNet) * 100).toFixed(2) + "%");
}

test();
