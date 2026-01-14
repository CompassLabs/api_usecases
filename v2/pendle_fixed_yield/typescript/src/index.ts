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

// Find active Pendle markets on Base with best fixed rates
const markets = await compass.earn.earnPendleMarkets({
  chain: "base",
  underlyingSymbol: "USDC",
  orderBy: "tvl_usd",
  limit: 10,
});

console.log("Active Pendle markets:", markets);
// SNIPPET END 2

// SNIPPET START 3
// Get unsigned transaction to deposit into Pendle PT fixed yield position
// Example market: Active USDC market on Base expiring 2026-02-05 with 13% APY
const manageResponse = await compass.earn.earnManage({
  owner: WALLET_ADDRESS,
  chain: "base",
  venue: {
    type: "PENDLE_PT",
    marketAddress: "0x9C1e33fFE5e6331879BbE58a8AfB65B632ed7867",
    token: "USDC",
    maxSlippagePercent: 1,
  },
  action: "DEPOSIT",
  amount: "1",
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
console.log("Deposit into Pendle fixed yield position confirmed!");
// SNIPPET END 4
