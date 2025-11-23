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
// Get unsigned transaction to fund Earn Account with USDC
const transferResponse = await compass.earn.earnTransfer({
  owner: WALLET_ADDRESS,
  chain: "base",
  token: "USDC",
  amount: "2",
  action: "DEPOSIT",
  gasSponsorship: false,
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

const transaction = transferResponse.transaction as any;
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
console.log("Earn Account funded successfully!");
// SNIPPET END 4

