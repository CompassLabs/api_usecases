// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;

const normalizePrivateKey = (key: string | undefined): `0x${string}` => {
  if (!key) throw new Error("Private key not set");
  return (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;
};

const OWNER_PRIVATE_KEY = normalizePrivateKey(process.env.OWNER_PRIVATE_KEY);
const SENDER_PRIVATE_KEY = normalizePrivateKey(process.env.SENDER_PRIVATE_KEY);

const sendTransaction = async (tx: any, walletClient: any, publicClient: any) => {
  const txHash = await walletClient.sendTransaction({
    ...tx,
    value: BigInt(tx.value || 0),
    gas: BigInt(tx.gas),
    maxFeePerGas: BigInt(tx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Transaction hash: ${txHash}`);
  console.log(`View on BaseScan: https://basescan.org/tx/0x${txHash}`);
  console.log(`Confirmed in block: ${receipt.blockNumber}`);
  return txHash;
};
// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({ apiKeyAuth: COMPASS_API_KEY });
const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);
const senderAccount = privateKeyToAccount(SENDER_PRIVATE_KEY);

const ownerWalletClient = createWalletClient({
  account: ownerAccount,
  chain: base,
  transport: http(BASE_RPC_URL),
});

const senderWalletClient = createWalletClient({
  account: senderAccount,
  chain: base,
  transport: http(BASE_RPC_URL),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});
// SNIPPET END 2

// ============================================================================
// EXAMPLE 1: Fund Earn Account with Gas Sponsorship
// ============================================================================

// SNIPPET START 3
// Get EIP-712 typed data for Permit2 approval
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
    console.log("Permit2 approval already exists - skipping to Example 2");
    approveResponse = null;
  } else {
    throw error;
  }
}
// SNIPPET END 3

// SNIPPET START 4
// Sign EIP-712 typed data with owner's private key
let approveEip712, approveSignature;
if (approveResponse?.eip712) {
  approveEip712 = approveResponse.eip712;
  approveSignature = await ownerWalletClient.signTypedData({
    domain: approveEip712.domain as any,
    types: approveEip712.types as any,
    primaryType: approveEip712.primaryType as string,
    message: approveEip712.message as any,
  });
} else {
  approveEip712 = null;
  approveSignature = null;
}
// SNIPPET END 4

// SNIPPET START 5
// Prepare and send Permit2 approval transaction
if (approveEip712 && approveSignature) {
  const prepareResponse = await compass.gasSponsorship.gasSponsorshipPrepare({
    owner: WALLET_ADDRESS,
    chain: "base",
    eip712: approveEip712,
    signature: approveSignature,
    sender: senderAccount.address,
  });
  await sendTransaction(prepareResponse.transaction as any, senderWalletClient, publicClient);
  console.log("Earn Account can now be funded with gas sponsorship");
} else {
  console.log("Skipping Example 1 transaction - Permit2 approval already exists");
}
// SNIPPET END 5

// ============================================================================
// EXAMPLE 2: Manage Earn Position (Deposit) with Gas Sponsorship
// ============================================================================

// SNIPPET START 6
// Get EIP-712 typed data for deposit
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
// SNIPPET END 6

// SNIPPET START 7
// Sign EIP-712 typed data with owner's private key
const manageEip712 = manageResponse.eip712!;
// Normalize types: API returns types with "safeTx" (lowercase) but primaryType "SafeTx" (capital)
// We need to ensure the types object has the key matching the primaryType for viem
const types = { ...manageEip712.types } as any;
if (types.safeTx && !types.SafeTx) {
  // Add SafeTx key if it doesn't exist (for viem compatibility)
  types.SafeTx = types.safeTx;
}
const manageSignature = await ownerWalletClient.signTypedData({
  domain: manageEip712.domain as any,
  types: types,
  primaryType: manageEip712.primaryType as string, // Use "SafeTx" from API
  message: manageEip712.message as any,
});
// SNIPPET END 7

// SNIPPET START 8
// Prepare and send deposit transaction
const prepareResponse = await compass.gasSponsorship.gasSponsorshipPrepare({
  owner: WALLET_ADDRESS,
  chain: "base",
  eip712: manageEip712,
  signature: manageSignature,
  sender: senderAccount.address,
});
await sendTransaction(prepareResponse.transaction as any, senderWalletClient, publicClient);
console.log("Gas-sponsored deposit transaction confirmed");
// SNIPPET END 8
