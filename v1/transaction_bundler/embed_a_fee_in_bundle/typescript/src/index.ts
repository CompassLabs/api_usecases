// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { createPublicClient, http } from "viem";
import { createWalletClient } from "viem";
import dotenv from "dotenv";

dotenv.config();

const COMPASS_API_KEY = process.env.COMPASS_API_KEY;
const SERVER_URL = process.env.SERVER_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
const SPECIFIC_MORPHO_VAULT =
  (process.env.SPECIFIC_MORPHO_VAULT as `0x${string}`) ||
  "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738";
console.log("SPECIFIC_MORPHO_VAULT", SPECIFIC_MORPHO_VAULT);

// SNIPPET END 1

// SNIPPET START 2
const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
});

const account = privateKeyToAccount(PRIVATE_KEY);
const WALLET_ADDRESS = account.address;

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
  await compass.transactionBundler.transactionBundlerAuthorization({
    chain: "base",
    sender: WALLET_ADDRESS,
  });

const signedAuth = await walletClient.signAuthorization({
  account,
  contractAddress: auth.address as `0x${string}`,
  nonce: auth.nonce,
});
// SNIPPET END 3

// Get ETH price in USD
const ethPrice = await compass.token.tokenPrice({
  chain: "ethereum",
  token: "ETH",
});

// How much ETH equals 1 USD
const oneUSDinETH = 1 / Number(ethPrice.price);

// Example: selling $0.03 worth of ETH
const amountInETH = 0.03 * oneUSDinETH;

console.log(`One USD in ETH: ${oneUSDinETH}`);
console.log(`0.03 USD worth of ETH: ${amountInETH}`);

const swapTX = await compass.swap.swapOdos({
  chain: "base",
  sender: WALLET_ADDRESS,
  tokenIn: "ETH",
  tokenOut: "USDC",
  amount: amountInETH,
  maxSlippagePercent: 1,
});
console.log(swapTX);

const swapTransaction = swapTX.transaction as any;

const swapTxHash = await walletClient.sendTransaction({
  ...swapTransaction,
  value: BigInt(swapTransaction.value),
  gas: BigInt(swapTransaction.gas),
  maxFeePerGas: BigInt(swapTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(swapTransaction.maxPriorityFeePerGas),
});
console.log("Odos Swap Tx Hash:", swapTxHash);

await publicClient.waitForTransactionReceipt({
  hash: swapTxHash,
});

console.log("here");

await new Promise((r) => setTimeout(r, 2000)); // pauses 1s

// SNIPPET START 4

const DEPOSIT_AMOUNT = 0.01; // amount the user will deposit in a Morpho vault
const FEE_PERCENTAGE = 0.01; // percentage fee you will charge the user
const FEE = DEPOSIT_AMOUNT * FEE_PERCENTAGE; // calculated fee
console.log(FEE);

// Create bundle of transactions
const bundlerTx =
  await compass.transactionBundler.transactionBundlerExecute({
    chain: "base",
    sender: WALLET_ADDRESS,
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

console.log("bunder tx hash", txHash);
const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 5

if (receipt.status !== "success") {
  throw Error();
}
