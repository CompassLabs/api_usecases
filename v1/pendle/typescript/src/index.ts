// SNIPPET START 21
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";
import { ContractEnum as Contract } from "@compass-labs/api-sdk/models/operations";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL as string;
const account = privateKeyToAccount(PRIVATE_KEY);
const WALLET_ADDRESS = account.address;
// SNIPPET END 21

console.log("ARBITRUM_RPC_URL", ARBITRUM_RPC_URL);
console.log("process.env.SERVER_URL", process.env.SERVER_URL);

// SNIPPET START 20
const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  // serverURL: "http://localhost:8000",
  serverURL: process.env.SERVER_URL || undefined, // do not set this
});

const walletClient = createWalletClient({
  account,
  chain: arbitrum,
  transport: http(ARBITRUM_RPC_URL),
});

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(ARBITRUM_RPC_URL),
});
// SNIPPET END 20

const ETHBalance = await compassApiSDK.token.tokenBalance({
  chain: "arbitrum",
  token: "ETH",
  user: WALLET_ADDRESS,
});

console.log("ETHBalance", ETHBalance);

// SNIPPET START 1
const { markets } = await compassApiSDK.pendle.pendleMarkets({
  chain: "arbitrum",
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

const swapTX = await compassApiSDK.swap.swapOdos({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  tokenIn: "ETH",
  tokenOut: "USDC",
  amount: 0.1,
  maxSlippagePercent: 10,
});

console.log("swapTX", swapTX);

const swapTxHash = await walletClient.sendTransaction({
  ...(swapTX.transaction as any),
  value: BigInt(swapTX.transaction.value), // Convert to BigInt
});

console.log(
  "yep",
  await publicClient.waitForTransactionReceipt({
    hash: swapTxHash,
  })
);

const USDCBalance = await compassApiSDK.token.tokenBalance({
  chain: "arbitrum",
  token: "USDC",
  user: WALLET_ADDRESS,
});

console.log("USDCBalance", USDCBalance);

// SNIPPET START 5
const UsdcAllowance = await compassApiSDK.universal.genericAllowance({
  chain: "arbitrum",
  user: WALLET_ADDRESS,
  token: "USDC",
  contract: Contract.PendleRouter,
});

if (BigInt(UsdcAllowance.amount) < 100) {
  // Set new allowance if current USDC allowance for Pendle Router is insufficient
  const setAllowanceForUsdcTx =
    await compassApiSDK.universal.genericAllowanceSet({
      chain: "arbitrum",
      sender: WALLET_ADDRESS,
      token: "USDC",
      contract: Contract.PendleRouter,
      amount: 100,
    });

  const txHash = await walletClient.sendTransaction(
    setAllowanceForUsdcTx.transaction as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 5

console.log("YES", WALLET_ADDRESS, marketAddress);

// SNIPPET START 6
const buyPtTx = await compassApiSDK.pendle.pendlePt({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "BUY",
  token: "USDC",
  amountIn: 100,
  maxSlippagePercent: 10,
});

console.log("YES 1");

let txHash = await walletClient.sendTransaction(buyPtTx.transaction as any);

const yes = await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 6

console.log("YES 2", yes);

// SNIPPET START 7
let { userPosition } = await compassApiSDK.pendle.pendleMarket({
  chain: "arbitrum",
  userAddress: WALLET_ADDRESS,
  marketAddress,
});
// SNIPPET END 7

console.log("YES 3", userPosition);

if (!userPosition) throw Error();

// SNIPPET START 8
const pTAllowance = await compassApiSDK.universal.genericAllowance({
  chain: "arbitrum",
  user: WALLET_ADDRESS,
  token: ptAddress,
  contract: Contract.PendleRouter,
});

console.log("YES 4");

if (pTAllowance.amount < userPosition.ptBalance) {
  // Set new allowance if current PT allowance for Pendle Router is insufficient
  const setAllowanceForPtTx = await compassApiSDK.universal.genericAllowanceSet(
    {
      chain: "arbitrum",
      sender: WALLET_ADDRESS,
      token: ptAddress,
      contract: Contract.PendleRouter,
      amount: userPosition.ptBalance,
    }
  );

  const txHash = await walletClient.sendTransaction(
    setAllowanceForPtTx.transaction as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 8

console.log("2");

// SNIPPET START 9
const sellPtTx = await compassApiSDK.pendle.pendlePt({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "SELL",
  token: underlyingAssetAddress,
  amountIn: userPosition.ptBalance,
  maxSlippagePercent: 10,
});

console.log("3");

txHash = await walletClient.sendTransaction(sellPtTx.transaction as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 9

// SNIPPET START 10
({ userPosition } = await compassApiSDK.pendle.pendleMarket({
  chain: "arbitrum",
  userAddress: WALLET_ADDRESS,
  marketAddress,
}));
// SNIPPET END 10

if (!userPosition) throw Error();

console.log("4", userPosition);

// SNIPPET START 11
const underlyingAssetAllowance = await compassApiSDK.universal.genericAllowance(
  {
    chain: "arbitrum",
    user: WALLET_ADDRESS,
    token: underlyingAssetAddress,
    contract: Contract.PendleRouter,
  }
);

if (underlyingAssetAllowance.amount < userPosition.underlyingTokenBalance) {
  console.log("5");
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.genericAllowanceSet({
      chain: "arbitrum",
      sender: WALLET_ADDRESS,
      token: underlyingAssetAddress,
      contract: Contract.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  const txHash = await walletClient.sendTransaction(
    setAllowanceForUnderlyingAssetTx.transaction as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  console.log("6");
}
// SNIPPET END 11

console.log("7");

// SNIPPET START 12
const buyYtTx = await compassApiSDK.pendle.pendleYt({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "BUY",
  token: underlyingAssetAddress,
  amountIn: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 10,
});

console.log("8");

txHash = await walletClient.sendTransaction(buyYtTx.transaction as any);

console.log(
  "9",
  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  })
);
// SNIPPET END 12

console.log("10");

// SNIPPET START 13
const redeemYieldTx = await compassApiSDK.pendle.pendleRedeemYield({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
});

txHash = await walletClient.sendTransaction(redeemYieldTx.transaction as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 13

// SNIPPET START 14
({ userPosition } = await compassApiSDK.pendle.pendleMarket({
  chain: "arbitrum",
  userAddress: WALLET_ADDRESS,
  marketAddress,
}));
// SNIPPET END 14

console.log("11", userPosition);

if (!userPosition) throw Error();

// SNIPPET START 15
const yTAllowance = await compassApiSDK.universal.genericAllowance({
  chain: "arbitrum",
  user: WALLET_ADDRESS,
  token: ytAddress,
  contract: Contract.PendleRouter,
});

if (yTAllowance.amount < userPosition.ytBalance) {
  // Set new allowance if current YT allowance for Pendle Router is insufficient
  const setAllowanceForPtTx = await compassApiSDK.universal.genericAllowanceSet(
    {
      chain: "arbitrum",
      sender: WALLET_ADDRESS,
      token: ytAddress,
      contract: Contract.PendleRouter,
      amount: userPosition.ytBalance,
    }
  );

  const txHash = await walletClient.sendTransaction(
    setAllowanceForPtTx.transaction as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 15

// SNIPPET START 16
const sellYtTx = await compassApiSDK.pendle.pendleYt({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "SELL",
  token: "USDT",
  amountIn: userPosition.ytBalance,
  maxSlippagePercent: 10,
});

txHash = await walletClient.sendTransaction(sellYtTx.transaction as any);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 16

// SNIPPET START 17
({ userPosition } = await compassApiSDK.pendle.pendleMarket({
  chain: "arbitrum",
  userAddress: WALLET_ADDRESS,
  marketAddress,
}));
// SNIPPET END 17

console.log("12", userPosition);

if (!userPosition) throw Error();

// SNIPPET START 18
const UsdtBalance = await compassApiSDK.token.tokenBalance({
  chain: "arbitrum",
  token: "USDT",
  user: WALLET_ADDRESS,
});

console.log("13", UsdtBalance);

const UsdtAllowance = await compassApiSDK.universal.genericAllowance({
  chain: "arbitrum",
  user: WALLET_ADDRESS,
  token: underlyingAssetAddress,
  contract: Contract.PendleRouter,
});

if (UsdtAllowance.amount < UsdtBalance.amount) {
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUsdtTx =
    await compassApiSDK.universal.genericAllowanceSet({
      chain: "arbitrum",
      sender: WALLET_ADDRESS,
      token: "USDT",
      contract: Contract.PendleRouter,
      amount: UsdtBalance.amount,
    });

  const txHash = await walletClient.sendTransaction(
    setAllowanceForUsdtTx.transaction as any
  );

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 18

// SNIPPET START 19
const supplyLiquidityTx = await compassApiSDK.pendle.pendleLiquidity({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "SUPPLY",
  token: "USDT",
  amountIn: UsdtBalance.amount,
  maxSlippagePercent: 10,
});

txHash = await walletClient.sendTransaction(
  supplyLiquidityTx.transaction as any
);

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 19
