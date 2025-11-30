// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
const OWNER_PRIVATE_KEY = (process.env.OWNER_PRIVATE_KEY?.startsWith("0x") 
  ? process.env.OWNER_PRIVATE_KEY 
  : `0x${process.env.OWNER_PRIVATE_KEY}`) as `0x${string}`;
const SENDER_PRIVATE_KEY = (process.env.SENDER_PRIVATE_KEY?.startsWith("0x") 
  ? process.env.SENDER_PRIVATE_KEY 
  : `0x${process.env.SENDER_PRIVATE_KEY}`) as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
});
// SNIPPET END 2

// ============================================================================
// EXAMPLE 1: Fund Earn Account with Gas Sponsorship
// ============================================================================

// SNIPPET START 3
// Step 1: Get EIP-712 typed data for Permit2 approval (gas-sponsored)
// Returns EIP-712 typed data that must be signed by the owner off-chain
let approveResponse;
try {
  approveResponse = await compass.gasSponsorship.gasSponsorshipApproveTransfer({
    owner: WALLET_ADDRESS,
    chain: "base",
    token: "USDC",
    gasSponsorship: true,
  });
} catch (error: any) {
  if (error.body?.includes("Token allowance already set")) {
    console.log("Permit2 approval already exists - skipping to Example 2 (Manage Position)");
    approveResponse = null;
  } else {
    throw error;
  }
}
// SNIPPET END 3

// SNIPPET START 4
// Step 2: Sign EIP-712 typed data with owner's private key (off-chain, no gas)
// This signature from Step 2 is required as input for Step 3
const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);
const ownerWalletClient = createWalletClient({
  account: ownerAccount,
  chain: base,
  transport: http(BASE_RPC_URL),
});
let approveEip712, approveSignature;
if (approveResponse && approveResponse.eip712) {
  approveEip712 = approveResponse.eip712;
  approveSignature = await ownerWalletClient.signTypedData({
    domain: approveEip712.domain as any,
    types: approveEip712.types as any,
    primaryType: approveEip712.primaryType as string,
    message: approveEip712.message as any,
  });
} else {
  console.log("Skipping Example 1 - Permit2 approval already exists");
  approveEip712 = null;
  approveSignature = null;
}
// SNIPPET END 4

// SNIPPET START 5
// Step 3: Prepare gas-sponsored Permit2 approval transaction
// Uses the signature from Step 2 as input. The sender will pay for gas to execute the Permit2 approval
const senderAccount = privateKeyToAccount(SENDER_PRIVATE_KEY);
let prepareApproveResponse;
if (approveEip712 && approveSignature) {
  prepareApproveResponse = await compass.gasSponsorship.gasSponsorshipPrepare({
    owner: WALLET_ADDRESS,
    chain: "base",
    eip712: approveEip712,
    signature: approveSignature, // Signature from Step 2
    sender: senderAccount.address,
  });
} else {
  prepareApproveResponse = null;
}
// SNIPPET END 5

// SNIPPET START 6
// Step 4: Sign and broadcast Permit2 approval transaction with sender's private key
const walletClient = createWalletClient({
  account: senderAccount,
  chain: base,
  transport: http(BASE_RPC_URL),
});
const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

if (prepareApproveResponse) {
  const approveTransaction = prepareApproveResponse.transaction as any;
  const approveTxHash = await walletClient.sendTransaction({
    ...approveTransaction,
    value: BigInt(approveTransaction.value || 0),
    gas: BigInt(approveTransaction.gas),
    maxFeePerGas: BigInt(approveTransaction.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(approveTransaction.maxPriorityFeePerGas),
  });

  console.log(`Permit2 approval transaction hash: ${approveTxHash}`);
  console.log(`View on BaseScan: https://basescan.org/tx/${approveTxHash}`);

  const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  console.log(`Permit2 approval confirmed in block: ${approveReceipt.blockNumber}`);
  console.log("Earn Account can now be funded with gas sponsorship");
} else {
  console.log("Skipping Example 1 transaction - Permit2 approval already exists");
}
// SNIPPET END 6

// ============================================================================
// EXAMPLE 2: Manage Earn Position (Deposit) with Gas Sponsorship
// ============================================================================

// SNIPPET START 7
// Step 1: Get EIP-712 typed data for gas-sponsored deposit
// Returns EIP-712 typed data that must be signed by the owner off-chain
const manageResponse = await compass.earn.earnManage({
  owner: WALLET_ADDRESS,
  chain: "base",
  venue: {
    type: "VAULT",
    vaultAddress: "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
  },
  action: "DEPOSIT",
  amount: "0.5",
  gasSponsorship: true,
  fee: null,
} as any);
// SNIPPET END 7

// SNIPPET START 8
// Step 2: Sign EIP-712 typed data with owner's private key (off-chain, no gas)
// This signature from Step 2 is required as input for Step 3
const manageEip712 = manageResponse.eip712!;
const manageSignature = await ownerWalletClient.signTypedData({
  domain: manageEip712.domain as any,
  types: manageEip712.types as any,
  primaryType: manageEip712.primaryType as string,
  message: manageEip712.message as any,
});
// SNIPPET END 8

// SNIPPET START 9
// Step 3: Prepare gas-sponsored deposit transaction
// Uses the signature from Step 2 as input. The sender will pay for gas to execute the deposit
const prepareManageResponse = await compass.gasSponsorship.gasSponsorshipPrepare({
  owner: WALLET_ADDRESS,
  chain: "base",
  eip712: manageEip712,
  signature: manageSignature, // Signature from Step 2
  sender: senderAccount.address,
});
// SNIPPET END 9

// SNIPPET START 10
// Step 4: Sign and broadcast deposit transaction with sender's private key
const manageTransaction = prepareManageResponse.transaction as any;
const manageTxHash = await walletClient.sendTransaction({
  ...manageTransaction,
  value: BigInt(manageTransaction.value || 0),
  gas: BigInt(manageTransaction.gas),
  maxFeePerGas: BigInt(manageTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(manageTransaction.maxPriorityFeePerGas),
});

console.log(`Deposit transaction hash: ${manageTxHash}`);
console.log(`View on BaseScan: https://basescan.org/tx/${manageTxHash}`);

const manageReceipt = await publicClient.waitForTransactionReceipt({ hash: manageTxHash });
console.log(`Deposit confirmed in block: ${manageReceipt.blockNumber}`);
console.log("Gas-sponsored deposit transaction confirmed");
// SNIPPET END 10

