// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base, arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
const PRIVATE_KEY = (process.env.PRIVATE_KEY?.startsWith("0x")
  ? process.env.PRIVATE_KEY
  : `0x${process.env.PRIVATE_KEY}`) as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL as string;
// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});

const account = privateKeyToAccount(PRIVATE_KEY);

const baseWalletClient = createWalletClient({
  account,
  chain: base,
  transport: http(BASE_RPC_URL),
});

const basePublicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

const arbitrumWalletClient = createWalletClient({
  account,
  chain: arbitrum,
  transport: http(ARBITRUM_RPC_URL),
});

const arbitrumPublicClient = createPublicClient({
  chain: arbitrum,
  transport: http(ARBITRUM_RPC_URL),
});
// SNIPPET END 2

console.log("=== CCTP Bridge: Base -> Arbitrum ===\n");

// SNIPPET START 3
// Step 1: Burn USDC on Base (source chain)
console.log("Step 1: Burning USDC on Base...\n");

const burnResponse = await compass.bridge.cctpBurn({
  owner: WALLET_ADDRESS,
  chain: "base",
  amount: "1",
  destinationChain: "arbitrum",
  gasSponsorship: false,
});

console.log(`Bridge ID: ${burnResponse.bridgeId}`);
// SNIPPET END 3

// SNIPPET START 4
// Sign and broadcast burn transaction
const burnTransaction = burnResponse.transaction as any;
const burnTxHash = await baseWalletClient.sendTransaction({
  ...burnTransaction,
  value: BigInt(burnTransaction.value || 0),
  gas: BigInt(burnTransaction.gas),
  maxFeePerGas: BigInt(burnTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(burnTransaction.maxPriorityFeePerGas),
});

console.log(`Burn tx hash: ${burnTxHash}`);
console.log(`View on BaseScan: https://basescan.org/tx/${burnTxHash}`);

const burnReceipt = await basePublicClient.waitForTransactionReceipt({
  hash: burnTxHash,
});
console.log(`Burn confirmed in block: ${burnReceipt.blockNumber}`);
console.log("✓ Burn transaction complete!\n");
// SNIPPET END 4

// SNIPPET START 5
// Step 2: Wait for attestation and prepare mint
console.log("Step 2: Waiting for Circle attestation...\n");

const POLL_INTERVAL_MS = 10000; // 10 seconds
const MAX_ATTEMPTS = 60; // 10 minutes max

let mintResponse;
let attempts = 0;

while (attempts < MAX_ATTEMPTS) {
  attempts++;
  console.log(`Polling for attestation (attempt ${attempts}/${MAX_ATTEMPTS})...`);

  mintResponse = await compass.bridge.cctpMint({
    bridgeId: burnResponse.bridgeId!,
    burnTxHash: burnTxHash,
    sender: WALLET_ADDRESS,
  });

  if (mintResponse.status === "completed") {
    console.log("Bridge already completed!\n");
    break;
  }

  if (mintResponse.status === "ready" || (mintResponse as any).transaction) {
    console.log("Attestation received! Ready to mint.\n");
    break;
  }

  console.log(`Status: ${mintResponse.status}. Waiting ${POLL_INTERVAL_MS / 1000}s before retry...`);
  await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
}

if (attempts >= MAX_ATTEMPTS) {
  throw new Error("Attestation not ready after maximum attempts");
}
// SNIPPET END 5

// SNIPPET START 6
// Step 3: Execute mint on Arbitrum (destination chain)
if (mintResponse!.status !== "completed") {
  console.log("Step 3: Executing mint on Arbitrum...\n");

  const mintTransaction = (mintResponse as any).transaction;
  const mintTxHash = await arbitrumWalletClient.sendTransaction({
    ...mintTransaction,
    value: BigInt(mintTransaction.value || 0),
    gas: BigInt(mintTransaction.gas),
    maxFeePerGas: BigInt(mintTransaction.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(mintTransaction.maxPriorityFeePerGas),
  });

  console.log(`Mint tx hash: ${mintTxHash}`);
  console.log(`View on Arbiscan: https://arbiscan.io/tx/${mintTxHash}`);

  const mintReceipt = await arbitrumPublicClient.waitForTransactionReceipt({
    hash: mintTxHash,
  });
  console.log(`Mint confirmed in block: ${mintReceipt.blockNumber}`);
  console.log("✓ Mint transaction complete!\n");
}
// SNIPPET END 6

console.log("=== Bridge Complete ===");
console.log(`Successfully bridged USDC from Base to Arbitrum`);
console.log(`Bridge ID: ${burnResponse.bridgeId}`);
