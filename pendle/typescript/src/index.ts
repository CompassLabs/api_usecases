// SNIPPET START 21
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";
import { ContractEnum as Contract } from "@compass-labs/api-sdk/models/operations";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string;
const account = privateKeyToAccount(PRIVATE_KEY);
const WALLET_ADDRESS = account.address;
// SNIPPET END 21

// SNIPPET START 20
const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
});

const walletClient = createWalletClient({
  account,
  chain: arbitrum,
  transport: http(RPC_URL),
});

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(RPC_URL),
});
// SNIPPET END 20

// SNIPPET START 1
const { markets } = await compassApiSDK.pendle.markets({
  chain: "arbitrum:mainnet",
});
// SNIPPET END 1

// SNIPPET START 2
const selectedMarket = markets[0];
// SNIPPET END 2

// SNIPPET START 3
const marketAddress = selectedMarket.address;
const underlyingAssetAddress = selectedMarket.underlyingAsset.split("-")[1];
const ptAddress = selectedMarket.pt.split("-")[1];
const ytAddress = selectedMarket.yt.split("-")[1];
// SNIPPET END 3

// SNIPPET START 4
let { userPosition, tokens } = await compassApiSDK.pendle.market({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress,
});
// SNIPPET END 4

if (!userPosition) throw Error();

// SNIPPET START 5
let underlyingAssetAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: underlyingAssetAddress,
  contract: Contract.PendleRouter,
});

if (underlyingAssetAllowance.amount < userPosition.underlyingTokenBalance) {
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.allowanceSet({
      chain: "arbitrum:mainnet",
      sender: WALLET_ADDRESS,
      token: underlyingAssetAddress,
      contract: Contract.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  const txHash = await walletClient.sendTransaction(
    setAllowanceForUnderlyingAssetTx as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 5

// SNIPPET START 6
const buyPtTx = await compassApiSDK.pendle.buyPt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress,
  tokenIn: tokens.underlyingToken.address,
  amountIn: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 0.1,
});

let txHash = await walletClient.sendTransaction(buyPtTx as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 6

// SNIPPET START 7
({ userPosition } = await compassApiSDK.pendle.market({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress,
}));
// SNIPPET END 7

if (!userPosition) throw Error();

// SNIPPET START 8
const pTAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: ptAddress,
  contract: Contract.PendleRouter,
});

if (pTAllowance.amount < userPosition.ptBalance) {
  // Set new allowance if current PT allowance for Pendle Router is insufficient
  const setAllowanceForPtTx = await compassApiSDK.universal.allowanceSet({
    chain: "arbitrum:mainnet",
    sender: WALLET_ADDRESS,
    token: ptAddress,
    contract: Contract.PendleRouter,
    amount: userPosition.ptBalance,
  });

  const txHash = await walletClient.sendTransaction(setAllowanceForPtTx as any);

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 8

// SNIPPET START 9
const sellPtTx = await compassApiSDK.pendle.sellPt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress,
  tokenOut: underlyingAssetAddress,
  amountIn: userPosition.ptBalance,
  maxSlippagePercent: 0.1,
});

txHash = await walletClient.sendTransaction(sellPtTx as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 9

// SNIPPET START 10
({ userPosition } = await compassApiSDK.pendle.market({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress,
}));
// SNIPPET END 10

if (!userPosition) throw Error();

// SNIPPET START 11
underlyingAssetAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: underlyingAssetAddress,
  contract: Contract.PendleRouter,
});

if (underlyingAssetAllowance.amount < userPosition.underlyingTokenBalance) {
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.allowanceSet({
      chain: "arbitrum:mainnet",
      sender: WALLET_ADDRESS,
      token: underlyingAssetAddress,
      contract: Contract.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  const txHash = await walletClient.sendTransaction(
    setAllowanceForUnderlyingAssetTx as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 11

// SNIPPET START 12
const buyYtTx = await compassApiSDK.pendle.buyYt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress,
  tokenIn: underlyingAssetAddress,
  amountIn: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 0.1,
});

txHash = await walletClient.sendTransaction(buyYtTx as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 12

// SNIPPET START 13
const redeemYieldTx = await compassApiSDK.pendle.redeemYield({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress,
});

txHash = await walletClient.sendTransaction(redeemYieldTx as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 13

// SNIPPET START 14
({ userPosition } = await compassApiSDK.pendle.market({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress,
}));
// SNIPPET END 14

if (!userPosition) throw Error();

// SNIPPET START 15
const yTAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: ytAddress,
  contract: Contract.PendleRouter,
});

if (yTAllowance.amount < userPosition.ytBalance) {
  // Set new allowance if current YT allowance for Pendle Router is insufficient
  const setAllowanceForPtTx = await compassApiSDK.universal.allowanceSet({
    chain: "arbitrum:mainnet",
    sender: WALLET_ADDRESS,
    token: ytAddress,
    contract: Contract.PendleRouter,
    amount: userPosition.ytBalance,
  });

  const txHash = await walletClient.sendTransaction(setAllowanceForPtTx as any);

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 15

// SNIPPET START 16
const sellYtTx = await compassApiSDK.pendle.sellYt({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress,
  tokenOut: underlyingAssetAddress,
  amountIn: userPosition.ytBalance,
  maxSlippagePercent: 0.1,
});

txHash = await walletClient.sendTransaction(sellYtTx as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 16

// SNIPPET START 17
({ userPosition } = await compassApiSDK.pendle.market({
  chain: "arbitrum:mainnet",
  userAddress: WALLET_ADDRESS,
  marketAddress,
}));
// SNIPPET END 17

if (!userPosition) throw Error();

// SNIPPET START 18
underlyingAssetAllowance = await compassApiSDK.universal.allowance({
  chain: "arbitrum:mainnet",
  user: WALLET_ADDRESS,
  token: underlyingAssetAddress,
  contract: Contract.PendleRouter,
});

if (underlyingAssetAllowance.amount < userPosition.underlyingTokenBalance) {
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.allowanceSet({
      chain: "arbitrum:mainnet",
      sender: WALLET_ADDRESS,
      token: underlyingAssetAddress,
      contract: Contract.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  const txHash = await walletClient.sendTransaction(
    setAllowanceForUnderlyingAssetTx as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 18

// SNIPPET START 19
const addLiquidityTx = await compassApiSDK.pendle.addLiquidity({
  chain: "arbitrum:mainnet",
  sender: WALLET_ADDRESS,
  marketAddress,
  tokenIn: underlyingAssetAddress,
  amountIn: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 0.1,
});

txHash = await walletClient.sendTransaction(addLiquidityTx as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 19
