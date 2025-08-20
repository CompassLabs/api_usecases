// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { createPublicClient, http } from "viem";
import { createWalletClient } from "viem";
import dotenv from "dotenv";


dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL as string;

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
});
// SNIPPET END 1

// SNIPPET START 2
const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(ETHEREUM_RPC_URL),
});

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(ETHEREUM_RPC_URL),
});
// SNIPPET END 2

// SNIPPET START 3
const auth =
  await compassApiSDK.transactionBundler.transactionBundlerAuthorization({
    chain: "ethereum",
    sender: account.address,
  });

const signedAuth = await walletClient.signAuthorization({
  account,
  contractAddress: auth.address as `0x${string}`,
  nonce: auth.nonce,
});
// SNIPPET END 3

const swapTX = await compassApiSDK.swap.swapOdos({
  chain: "ethereum",
  sender: account.address,
  tokenIn: "ETH",
  tokenOut: "WETH",
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

// SNIPPET START 4
const bundlerTx =
  await compassApiSDK.transactionBundler.transactionBundlerExecute({
    chain: "ethereum",
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
          token: "WETH",
          contract: "UniswapV3Router",
          amount: 1,
        },
      },
      {
        body: {
          actionType: "UNISWAP_SELL_EXACTLY",
          amountIn: 1,
          fee: "0.01",
          maxSlippagePercent: 0.5,
          tokenIn: "WETH",
          tokenOut: "USDC",
        },
      },
    ],
  });
// SNIPPET END 4

// SNIPPET START 5
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
// SNIPPET END 5

if (receipt.status !== "success") {
  throw Error();
}
