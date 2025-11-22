// SNIPPET START 1
// Import Libraries & Environment Variables
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
// SNIPPET END 1

// SNIPPET START 2
// Initialize Compass SDK
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});
// SNIPPET END 2

// SNIPPET START 3
// Create Earn Account (No Gas Sponsorship)
// Get unsigned transaction to create an Earn Account on Base
// owner: The address that will own and control the Earn Account
// sender: The address that will sign and pay for gas (same as owner = no gas sponsorship)
const createAccountResponse = await compass.earn.earnCreateAccount({
  chain: "base",
  sender: WALLET_ADDRESS,
  owner: WALLET_ADDRESS,
  estimateGas: true,
});

console.log("Earn Account Address:", createAccountResponse.earnAccountAddress);
console.log("Unsigned Transaction:", createAccountResponse.transaction);
// SNIPPET END 3

