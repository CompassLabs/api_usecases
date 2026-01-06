import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
dotenv.config();

const compass = new CompassApiSDK({ apiKeyAuth: process.env.COMPASS_API_KEY as string });

async function test() {
  try {
    // Test with vaultAddress (camelCase)
    const resp1 = await compass.earn.earnManage({
      owner: process.env.WALLET_ADDRESS as `0x${string}`,
      chain: "base",
      venue: {
        type: "VAULT",
        vaultAddress: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
      },
      action: "DEPOSIT",
      amount: "0.01",
      gasSponsorship: false,
      fee: null,
    });
    console.log("Success with vaultAddress");
  } catch (e: any) {
    console.log("Error with vaultAddress:", e.message);
  }
}

test();
