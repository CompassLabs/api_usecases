// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";
import {base, mainnet} from "viem/chains";
import { createPublicClient, http } from "viem";
import { createWalletClient } from "viem";
import dotenv from "dotenv";


dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
const SPECIFIC_MORPHO_VAULT = process.env.SPECIFIC_MORPHO_VAULT as `0x${string}`;
console.log(SPECIFIC_MORPHO_VAULT)

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
});
// SNIPPET END 1

// SNIPPET START 2
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
// SNIPPET END 2


// SNIPPET START 3
const auth =
  await compassApiSDK.transactionBundler.transactionBundlerAuthorization({
    chain: "base",
    sender: account.address,
  });

const signedAuth = await walletClient.signAuthorization({
  account,
  contractAddress: auth.address as `0x${string}`,
  nonce: auth.nonce,
});
// SNIPPET END 3


// Get ETH price in USD
const ethPrice = await compassApiSDK.token.tokenPrice({
  chain: "ethereum",
  token: "ETH",
});

// How much ETH equals 1 USD
const oneUSDinETH = 1 / Number(ethPrice.price);

// Example: selling $0.03 worth of ETH
const amountInETH = 0.03 * oneUSDinETH;

console.log(`One USD in ETH: ${oneUSDinETH}`);
console.log(`0.03 USD worth of ETH: ${amountInETH}`);

const swapTX = await compassApiSDK.swap.swapOdos({
  chain: "base",
  sender: account.address,
  tokenIn: "ETH",
  tokenOut: "USDC",
  amount: amountInETH,
  maxSlippagePercent: 1,
});
console.log(swapTX)

const transaction = swapTX.transaction as any;

const swapTxHash = await walletClient.sendTransaction({
  ...transaction,
  value: BigInt(transaction.value),
  gas: BigInt(transaction.gas),
  maxFeePerGas: BigInt(transaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
});
console.log(swapTxHash)

await publicClient.waitForTransactionReceipt({
  hash: swapTxHash,
});

await new Promise(r => setTimeout(r, 3000)); // pauses 1s

// SNIPPET START 4

const DEPOSIT_AMOUNT = 0.01; // amount the user will deposit in a Morpho vault
const FEE_PERCENTAGE = 0.01; // percentage fee you will charge the user
const FEE = DEPOSIT_AMOUNT * FEE_PERCENTAGE; // calculated fee
console.log(FEE)

// Create bundle of transactions
const bundlerTx =
  await compassApiSDK.transactionBundler.transactionBundlerExecute({
    chain: "base",
    sender: account.address,
    signedAuthorization: {
      nonce: signedAuth.nonce,
      address: signedAuth.address,
      chainId: signedAuth.chainId,
      r: signedAuth.r,
      s: signedAuth.s,
      yParity: signedAuth.yParity as number,
    },
    actions: [
      {
        body: {
          actionType: "SET_ALLOWANCE",
          token: "USDC",
          contract: SPECIFIC_MORPHO_VAULT,
          amount: DEPOSIT_AMOUNT,
        },
      },
      {
        body: {
          actionType: "TOKEN_TRANSFER",
          token: "USDC",
          to: "0xb8340945eBc917D2Aa0368a5e4E79C849c461511",
          amount: FEE,
        },
      },
      {
        body: {
          vaultAddress: SPECIFIC_MORPHO_VAULT,
          actionType: "MORPHO_DEPOSIT",
          amount: DEPOSIT_AMOUNT - FEE,
        },
      },
    ],
  });
// SNIPPET END 4
//
// SNIPPET START 5
const bundlerTransaction = bundlerTx.transaction as any;
const txHash = await walletClient.sendTransaction({
  ...bundlerTransaction,
  value: BigInt(bundlerTransaction.value || 0),
  gas: BigInt(bundlerTransaction.gas),
  maxFeePerGas: BigInt(bundlerTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(bundlerTransaction.maxPriorityFeePerGas),
});

console.log(txHash)
const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 5

if (receipt.status !== "success") {
  throw Error();
}
