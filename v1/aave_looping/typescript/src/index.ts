// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { createPublicClient, http } from "viem";
import { createWalletClient } from "viem";
import { type BundlerTransactionResponse } from "@compass-labs/api-sdk/models/components";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL as string;
// SNIPPET END 1

// SNIPPET START 2
const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
});

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(ETHEREUM_RPC_URL as string),
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

// SNIPPET START 4
const loopingTx =
  (await compassApiSDK.transactionBundler.transactionBundlerAaveLoop({
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
    collateralToken: "USDC",
    borrowToken: "WETH",
    initialCollateralAmount: 4,
    multiplier: 1.5,
    maxSlippagePercent: 2.5,
    loanToValue: 70,
  })) as BundlerTransactionResponse;

// SNIPPET END 4

// SNIPPET START 5
const bunderTx = await walletClient.sendTransaction(
  loopingTx.transaction as any
);

const txHash = await walletClient.sendTransaction(bunderTx as any);

const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 5

if (receipt.status !== "success") {
  throw Error();
}
