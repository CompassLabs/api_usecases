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
const FEE_RECIPIENT = process.env.FEE_RECIPIENT as `0x${string}`;
// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});
// SNIPPET END 2

// SNIPPET START 3
// Get unsigned transaction to withdraw from vault with performance fee
const manageResponse = await compass.earn.earnManage({
  owner: WALLET_ADDRESS,
  chain: "base",
  venue: {
    type: "VAULT",
    vaultAddress: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
  },
  action: "WITHDRAW",
  amount: "0.01",  // Amount to withdraw
  gasSponsorship: false,
  fee: {
    recipient: FEE_RECIPIENT,
    amount: "20",  // 20% of profit
    denomination: "PERFORMANCE",
  },
});
// SNIPPET END 3

// SNIPPET START 4
// Sign and broadcast transaction
if (!manageResponse.transaction) {
  throw new Error("No transaction returned from API");
}

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

const transaction = manageResponse.transaction;
const txHash = await walletClient.sendTransaction({
  to: transaction.to as `0x${string}`,
  data: transaction.data as `0x${string}`,
  value: BigInt(transaction.value || 0),
  gas: transaction.gas ? BigInt(transaction.gas) : undefined,
  maxFeePerGas: BigInt(transaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
  nonce: Number(transaction.nonce),
});

console.log(`Transaction hash: ${txHash}`);
console.log(`View on BaseScan: https://basescan.org/tx/${txHash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
console.log("Withdrawal with performance fee transaction confirmed");
// SNIPPET END 4
