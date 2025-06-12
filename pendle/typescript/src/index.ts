import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";
import { ContractName } from "@compass-labs/api-sdk/models/operations";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string;

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  serverURL: "http://0.0.0.0:8000",
});

const account = privateKeyToAccount(PRIVATE_KEY);
const WALLET_ADDRESS = account.address;

const walletClient = createWalletClient({
  account,
  chain: arbitrum,
  transport: http(RPC_URL),
});

//   const publicClient = createPublicClient({
//     chain: arbitrum,
//     transport: http(RPC_URL),
//   });

// SNIPPET START 1
const { markets } = await compassApiSDK.pendle.markets({
  chain: "arbitrum:mainnet",
});

const market = markets[0];

console.log("market", market);

let userPosition = await compassApiSDK.pendle.position({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress: market.address,
});
// SNIPPET END 1

console.log("1", userPosition);

// SNIPPET START 2
let underlyingAssetAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: market.underlyingAsset,
  contractName: ContractName.PendleRouter,
});

if (underlyingAssetAllowance.amount < userPosition.underlyingTokenBalance) {
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.allowanceSet({
      chain: "arbitrum:mainnet",
      sender: WALLET_ADDRESS,
      token: market.underlyingAsset,
      contractName: ContractName.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  await walletClient.sendTransaction(setAllowanceForUnderlyingAssetTx as any);
}

const buyPtTx = await compassApiSDK.pendle.buyPt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress: market.address,
  amount: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 0.1,
});

await walletClient.sendTransaction(buyPtTx as any);
// SNIPPET END 2

// SNIPPET START 3
userPosition = await compassApiSDK.pendle.position({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress: market.address,
});

console.log("2", userPosition);

const pTAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: market.pt,
  contractName: ContractName.PendleRouter,
});

if (pTAllowance.amount < userPosition.ptBalance) {
  // Set new allowance if current PT allowance for Pendle Router is insufficient
  const setAllowanceForPtTx = await compassApiSDK.universal.allowanceSet({
    chain: "arbitrum:mainnet",
    sender: WALLET_ADDRESS,
    token: market.pt,
    contractName: ContractName.PendleRouter,
    amount: userPosition.ptBalance,
  });

  await walletClient.sendTransaction(setAllowanceForPtTx as any);
}

const sellPtTx = await compassApiSDK.pendle.sellPt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress: market.address,
  amount: userPosition.ptBalance,
  maxSlippagePercent: 0.1,
});

await walletClient.sendTransaction(sellPtTx as any);
// SNIPPET END 3

// SNIPPET START 4
userPosition = await compassApiSDK.pendle.position({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress: market.address,
  maxSlippagePercent: 0.1,
});
console.log("3", userPosition);

underlyingAssetAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: market.underlyingAsset,
  contractName: ContractName.PendleRouter,
});

if (underlyingAssetAllowance.amount < userPosition.underlyingTokenBalance) {
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.allowanceSet({
      chain: "arbitrum:mainnet",
      sender: WALLET_ADDRESS,
      token: market.underlyingAsset,
      contractName: ContractName.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  await walletClient.sendTransaction(setAllowanceForUnderlyingAssetTx as any);
}

const buyYtTx = await compassApiSDK.pendle.buyYt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress: market.address,
  amount: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 0.1,
});

await walletClient.sendTransaction(buyYtTx as any);
// SNIPPET END 4

// SNIPPET START 5
const redeemYieldTx = await compassApiSDK.pendle.redeemYield({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress: market.address,
});

await walletClient.sendTransaction(redeemYieldTx as any);

userPosition = await compassApiSDK.pendle.position({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress: market.address,
});
console.log("4", userPosition);

const yTAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: market.yt,
  contractName: ContractName.PendleRouter,
});

if (yTAllowance.amount < userPosition.ytBalance) {
  // Set new allowance if current YT allowance for Pendle Router is insufficient
  const setAllowanceForPtTx = await compassApiSDK.universal.allowanceSet({
    chain: "arbitrum:mainnet",
    sender: WALLET_ADDRESS,
    token: market.yt,
    contractName: ContractName.PendleRouter,
    amount: userPosition.ytBalance,
  });

  await walletClient.sendTransaction(setAllowanceForPtTx as any);
}

const sellYtTx = await compassApiSDK.pendle.sellYt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress: market.address,
  amount: userPosition.ytBalance,
  maxSlippagePercent: 0.1,
});

await walletClient.sendTransaction(sellYtTx as any);
// SNIPPET END 5

// SNIPPET START 6
userPosition = await compassApiSDK.pendle.position({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress: market.address,
});
console.log("6", userPosition);

underlyingAssetAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: market.underlyingAsset,
  contractName: ContractName.PendleRouter,
});

if (underlyingAssetAllowance.amount < userPosition.underlyingTokenBalance) {
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.allowanceSet({
      chain: "arbitrum:mainnet",
      sender: WALLET_ADDRESS,
      token: market.underlyingAsset,
      contractName: ContractName.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  await walletClient.sendTransaction(setAllowanceForUnderlyingAssetTx as any);
}

const addLiquidityTx = await compassApiSDK.pendle.addLiquidity({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress: market.address,
  amount: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 0.1,
});

await walletClient.sendTransaction(addLiquidityTx as any);
// SNIPPET END 6
