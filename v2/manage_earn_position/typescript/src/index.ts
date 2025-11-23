// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
const PRIVATE_KEY = (process.env.PRIVATE_KEY?.startsWith("0x") 
  ? process.env.PRIVATE_KEY 
  : `0x${process.env.PRIVATE_KEY}`) as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});
// SNIPPET END 2

// SNIPPET START 3
// Get unsigned transaction to deposit into Morpho vault
const manageResponse = await compass.earn.earnManage({
  owner: WALLET_ADDRESS,
  chain: "base",
  venue: {
    type: "VAULT",
    vaultAddress: "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
  },
  action: "DEPOSIT",
  amount: "0.5",
  gasSponsorship: false,
  fee: null,
});
// SNIPPET END 3

// SNIPPET START 4
// Sign and broadcast transaction
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(BASE_RPC_URL),
});
const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

const transaction = manageResponse.transaction as any;
const txHash = await walletClient.sendTransaction({
  ...transaction,
  value: BigInt(transaction.value || 0),
  gas: BigInt(transaction.gas),
  maxFeePerGas: BigInt(transaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
});

console.log(`Transaction hash: ${txHash}`);
console.log(`View on BaseScan: https://basescan.org/tx/${txHash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
console.log("Deposit transaction confirmed");
// SNIPPET END 4

// SNIPPET START 5
// Check Earn Account positions
const positionsResponse = await compass.earn.earnPositions({
  chain: "base",
  userAddress: WALLET_ADDRESS,
  days: 100,
});

console.log(`\nPositions: ${positionsResponse.userPositions.length}`);
for (const position of positionsResponse.userPositions) {
  if (position.type === "VAULT") {
    console.log(`${position.vaultName}: ${position.amountInUnderlyingToken} ${position.tokenName}`);
  } else if (position.type === "AAVE") {
    console.log(`Aave ${position.tokenName}: ${position.amountInUnderlyingToken}`);
  }
}
// SNIPPET END 5

