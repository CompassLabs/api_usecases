// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { http, createWalletClient, createPublicClient, signTypedData } from "viem";

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

// SNIPPET START 3
// Get EIP-712 typed data for gas-sponsored deposit
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
});
// SNIPPET END 3

// SNIPPET START 4
// Sign EIP-712 typed data with owner's private key
const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);
const eip712 = manageResponse.eip712!;
const signature = await signTypedData({
  account: ownerAccount,
  domain: eip712.domain as any,
  types: eip712.types as any,
  primaryType: eip712.primaryType,
  message: eip712.message as any,
});
// SNIPPET END 4

// SNIPPET START 5
// Prepare gas-sponsored transaction
const senderAccount = privateKeyToAccount(SENDER_PRIVATE_KEY);
const prepareResponse = await compass.gasSponsorship.gasSponsorshipPrepare({
  owner: WALLET_ADDRESS,
  chain: "base",
  eip712: eip712,
  signature: signature,
  sender: senderAccount.address,
});
// SNIPPET END 5

// SNIPPET START 6
// Sign and broadcast transaction with sender's private key
const walletClient = createWalletClient({
  account: senderAccount,
  chain: base,
  transport: http(BASE_RPC_URL),
});
const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

const transaction = prepareResponse.transaction as any;
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
console.log("Gas-sponsored deposit transaction confirmed");
// SNIPPET END 6

