// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";
import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const OWNER_ADDRESS = process.env.OWNER_ADDRESS as `0x${string}`;
const OWNER_PRIVATE_KEY = (process.env.OWNER_PRIVATE_KEY?.startsWith("0x")
  ? process.env.OWNER_PRIVATE_KEY
  : `0x${process.env.OWNER_PRIVATE_KEY}`) as `0x${string}`;
const SENDER_ADDRESS = process.env.SENDER_ADDRESS as `0x${string}`;
const SENDER_PRIVATE_KEY = (process.env.SENDER_PRIVATE_KEY?.startsWith("0x")
  ? process.env.SENDER_PRIVATE_KEY
  : `0x${process.env.SENDER_PRIVATE_KEY}`) as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});

const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);
const senderAccount = privateKeyToAccount(SENDER_PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});
// SNIPPET END 2

// NOTE: Step 1 already completed - approval is one-time per token
// console.log("\n=== Step 1: Approve Token Transfer (One-time per token) ===\n");

console.log("=== Step 2: Fund Earn Account with Gas Sponsorship ===\n");

// Create sender wallet client for Step 2
const senderWalletClient = createWalletClient({
  account: senderAccount,
  chain: base,
  transport: http(BASE_RPC_URL),
});

// SNIPPET START 7
// Get EIP-712 typed data for gas-sponsored transfer
const transferResponse = await compass.earn.earnTransfer({
  owner: OWNER_ADDRESS,
  chain: "base",
  token: "USDC",
  amount: "0.1",
  action: "DEPOSIT",
  gasSponsorship: true,
  spender: SENDER_ADDRESS,
});

console.log("EIP-712 typed data received for transfer");
// SNIPPET END 7

// SNIPPET START 8
// Owner signs the transfer typed data off-chain
const transferTypedData = transferResponse.eip712 as any;
// Normalize type keys to PascalCase to match EIP-712 standard
const normalizedTypes: any = {};
for (const [key, value] of Object.entries(transferTypedData.types)) {
  // Special handling for EIP712Domain
  const normalizedKey = key === 'eip712Domain' ? 'EIP712Domain' : key.charAt(0).toUpperCase() + key.slice(1);
  normalizedTypes[normalizedKey] = value;
}

// Use eth-sig-util for EIP-712 signing (more permissive than viem)
const normalizedData = {
  types: normalizedTypes,
  primaryType: transferTypedData.primaryType,
  domain: transferTypedData.domain,
  message: transferTypedData.message,
};

const transferSignature = signTypedData({
  privateKey: Buffer.from(OWNER_PRIVATE_KEY.slice(2), 'hex'),
  data: normalizedData,
  version: SignTypedDataVersion.V4,
});

console.log("Owner signed transfer off-chain");
// SNIPPET END 8

// SNIPPET START 9
// Prepare gas-sponsored transfer transaction
const prepareTransferResponse = await compass.gasSponsorship.gasSponsorshipPrepare({
  owner: OWNER_ADDRESS,
  chain: "base",
  eip712: transferTypedData,
  signature: transferSignature,
  sender: SENDER_ADDRESS,
});

console.log("Gas-sponsored transfer transaction prepared");
// SNIPPET END 9

// SNIPPET START 10
// Sender signs and broadcasts the transfer transaction
const transferTransaction = prepareTransferResponse.transaction as any;
const transferTxHash = await senderWalletClient.sendTransaction({
  ...transferTransaction,
  value: BigInt(transferTransaction.value || 0),
  gas: BigInt(transferTransaction.gas),
  maxFeePerGas: BigInt(transferTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(transferTransaction.maxPriorityFeePerGas),
});

console.log(`Transfer tx hash: ${transferTxHash}`);
console.log(`View on BaseScan: https://basescan.org/tx/${transferTxHash}`);

const transferReceipt = await publicClient.waitForTransactionReceipt({
  hash: transferTxHash,
});
console.log(`Transfer confirmed in block: ${transferReceipt.blockNumber}`);
console.log("✓ Earn Account funded with gas sponsorship!\n");
// SNIPPET END 10
