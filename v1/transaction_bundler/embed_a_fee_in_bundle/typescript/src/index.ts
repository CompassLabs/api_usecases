// SNIPPET START 11
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";
//import { mainnet } from "viem/chains";
import { base } from "viem/chains";
import { createPublicClient, http } from "viem";
import { createWalletClient } from "viem";
import dotenv from "dotenv";


dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
//const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL as string;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
//const DEPOSIT_AMOUNT = 0.01; // amount the user will deposit in a Morpho vault
const SPECIFIC_MORPHO_VAULT = process.env
  .SPECIFIC_MORPHO_VAULT as `0x${string}` || "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738";


// SNIPPET END 11

// SNIPPET START 12
// Initialize SDK and Web3 clients
const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
});

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
// SNIPPET END 12

//using ODOS to perform the swap
const swapTX = await compassApiSDK.swap.swapOdos({
  chain: "base",
  sender: account.address,
  tokenIn: "ETH",
  tokenOut: "USDC",
  amount: 1,
  maxSlippagePercent: 1,
});

const transaction = swapTX.transaction as any;
const swapTxHash = await walletClient.sendTransaction({
  ...transaction,
  value: BigInt(transaction.value),
  gas: BigInt(transaction.gas),
  maxFeePerGas: BigInt(transaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
});

await publicClient.waitForTransactionReceipt({
  hash: swapTxHash,
});

await new Promise((r) => setTimeout(r, 2000)); // pauses 2s


// SNIPPET START 13
// Get and Sign Authorization
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
// SNIPPET END 13



await new Promise((r) => setTimeout(r, 2000)); // pauses 2s

// SNIPPET START 14


const DEPOSIT_AMOUNT = 0.01; // amount the user will deposit in a Morpho vault
const FEE_PERCENTAGE = 0.01; // percentage fee you will charge the user
const FEE = DEPOSIT_AMOUNT * FEE_PERCENTAGE; // calculated fee
console.log(FEE);

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
          amount: 1,
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
          actionType: "MORPHO_DEPOSIT",
          vaultAddress: SPECIFIC_MORPHO_VAULT,
          amount: DEPOSIT_AMOUNT - FEE,
        },
      },

      // {
      //   body: {
      //     actionType: "UNISWAP_SELL_EXACTLY",
      //     amountIn: 1,
      //     fee: "0.01",
      //     maxSlippagePercent: 0.5,
      //     tokenIn: "USDC",
      //     tokenOut: "USDC",
      //   },
      // },
    ],
  });
// SNIPPET END 14

// SNIPPET START 15
// Sign and broadcast the bundler transaction
const bundlerTransaction = bundlerTx.transaction as any;
const txHash = await walletClient.sendTransaction({
  ...bundlerTransaction,
  value: BigInt(bundlerTransaction.value || 0),
  gas: BigInt(bundlerTransaction.gas),
  maxFeePerGas: BigInt(bundlerTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(bundlerTransaction.maxPriorityFeePerGas),
});

const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 15

///

if (receipt.status !== "success") {
  throw Error();
}
