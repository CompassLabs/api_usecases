// SNIPPET START 21
// Import Libraries & Environment Variables
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";
import { ContractEnum as Contract } from "@compass-labs/api-sdk/models/operations";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
//const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;

const COMPASS_API_KEY = process.env.COMPASS_API_KEY;
const SERVER_URL = process.env.SERVER_URL;
const DEPOSIT_AMOUNT = 0.01; // amount the user will deposit in a Aave pool

// SNIPPET END 21

// SNIPPET START 22
// Initialize Compass SDK and Account

const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
  serverURL: SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
});

const account = privateKeyToAccount(PRIVATE_KEY);
const WALLET_ADDRESS = account.address;
console.log("WALLET_ADDRESS", WALLET_ADDRESS);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(BASE_RPC_URL),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});
// SNIPPET END 22

// Get ETH price in USD
const ethPrice = await compass.token.tokenPrice({
  chain: "ethereum",
  token: "ETH",
});

/////////////////////////////////////////////////////////////////

const result = await compass.token.tokenBalance({
  chain: "base",
  user: WALLET_ADDRESS,
  token: "ETH",
});
console.log(result);
// const ethPrice = await compass.token.tokenPrice({
//   chain: "ethereum",
//   user: account.address
//   token: "ETH",
// });
/////////////////////////////////////////////////////////////////

// How much ETH equals 1 USD
const oneUSDinETH = 1 / Number(ethPrice.price);

// Example: selling $0.03 worth of ETH
const amountInETH = 0.03 * oneUSDinETH;

console.log(`One USD in ETH: ${oneUSDinETH}`);
console.log(`0.03 USD worth of ETH: ${amountInETH}`);

const swapTx = await compass.swap.swapOdos({
  chain: "base",
  sender: WALLET_ADDRESS,
  tokenIn: "ETH",
  tokenOut: "USDC",
  amount: amountInETH,
  maxSlippagePercent: 1,
});
console.log(swapTx);

const swapTransaction = swapTx.transaction as any;

const swapTxHash = await walletClient.sendTransaction({
  ...swapTransaction,
  value: BigInt(swapTransaction.value),
  gas: BigInt(swapTransaction.gas),
  maxFeePerGas: BigInt(swapTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(swapTransaction.maxPriorityFeePerGas),
});
console.log("Swap Tx Hash:", swapTxHash);

await publicClient.waitForTransactionReceipt({
  hash: swapTxHash,
});

await new Promise((r) => setTimeout(r, 1000)); // pauses 1s

// SNIPPET START 23
// SET ALLOWANCE
// Get unsigned Allowance Transaction from the Compass API
const allowanceTx = await compass.universal.genericAllowanceSet({
  chain: "base",
  sender: WALLET_ADDRESS,
  contract: "AaveV3Pool",
  amount: DEPOSIT_AMOUNT,
  token: "USDC",
});
console.log("allowanceTx", allowanceTx);

// SNIPPET END 23

// SNIPPET START 24
// Sign and broadcast unsigned allowance transaction
const allowanceTransaction = allowanceTx.transaction as any;
const allowanceTxHash = await walletClient.sendTransaction({
  ...allowanceTransaction,
  value: BigInt(allowanceTransaction.value || 0),
  gas: BigInt(allowanceTransaction.gas),
  maxFeePerGas: BigInt(allowanceTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(allowanceTransaction.maxPriorityFeePerGas),
});
console.log("Set allowance tx hash:", allowanceTxHash);
const allowanceTxReceipt = await publicClient.waitForTransactionReceipt({
  hash: allowanceTxHash,
});

if (allowanceTxReceipt.status !== "success") {
  throw Error();
}
// SNIPPET END 24

// SNIPPET START 25
// DEPOSIT ON AAVE
// Get unsigned Aave Deposit Transaction from the Compass API
const aaveDepositTx = await compass.aaveV3.aaveSupply({
  chain: "base",
  sender: WALLET_ADDRESS,
  token: "USDC",
  amount: DEPOSIT_AMOUNT,
});
console.log("Aave Deposit Tx", aaveDepositTx);
// SNIPPET END 25

// SNIPPET START 26
// Sign and broadcast unsigned Aave Deposit transaction
const aaveDepositTransaction = aaveDepositTx.transaction as any;
const aaveDepositTxHash = await walletClient.sendTransaction({
  ...aaveDepositTransaction,
  value: BigInt(aaveDepositTransaction.value || 0),
  gas: BigInt(aaveDepositTransaction.gas),
  maxFeePerGas: BigInt(aaveDepositTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(aaveDepositTransaction.maxPriorityFeePerGas),
});

const aaveDepositTxReceipt = await publicClient.waitForTransactionReceipt({
  hash: aaveDepositTxHash,
});

if (aaveDepositTxReceipt.status !== "success") {
  throw Error();
}

console.log("Aave deposit tx hash:", aaveDepositTxHash);

// SNIPPET END 26
