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

// SNIPPET START 20
const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
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

// SNIPPET START 1
const { markets } = await compassApiSDK.pendle.pendleMarkets({
  chain: "arbitrum",
});
// SNIPPET END 1

// SNIPPET START 2
const selectedMarket = markets[1];
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
  maxSlippagePercent: 2,
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

  const allowanceTx = setAllowanceForUsdcTx.transaction as any;
  const txHash = await walletClient.sendTransaction({
    ...allowanceTx,
    value: BigInt(allowanceTx.value || 0),
    gas: BigInt(allowanceTx.gas),
    maxFeePerGas: BigInt(allowanceTx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(allowanceTx.maxPriorityFeePerGas),
  });

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 5

// SNIPPET START 6
const buyPtTx = await compassApiSDK.pendle.pendlePt({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "BUY",
  token: "USDC",
  amountIn: 100,
  maxSlippagePercent: 4,
});

const buyTx = buyPtTx.transaction as any;
let txHash = await walletClient.sendTransaction({
  ...buyTx,
  value: BigInt(buyTx.value || 0),
  gas: BigInt(buyTx.gas),
  maxFeePerGas: BigInt(buyTx.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(buyTx.maxPriorityFeePerGas),
});

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 6

// SNIPPET START 7
let { userPosition } = await compassApiSDK.pendle.pendleMarket({
  chain: "arbitrum",
  userAddress: WALLET_ADDRESS,
  marketAddress,
});
// SNIPPET END 7

if (!userPosition) throw Error();

// SNIPPET START 8
const pTAllowance = await compassApiSDK.universal.genericAllowance({
  chain: "arbitrum",
  user: WALLET_ADDRESS,
  token: ptAddress,
  contract: Contract.PendleRouter,
});

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

  const ptAllowanceTx = setAllowanceForPtTx.transaction as any;
  const txHash = await walletClient.sendTransaction({
    ...ptAllowanceTx,
    value: BigInt(ptAllowanceTx.value || 0),
    gas: BigInt(ptAllowanceTx.gas),
    maxFeePerGas: BigInt(ptAllowanceTx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(ptAllowanceTx.maxPriorityFeePerGas),
  });

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 8

// SNIPPET START 9
const sellPtTx = await compassApiSDK.pendle.pendlePt({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "SELL",
  token: underlyingAssetAddress,
  amountIn: userPosition.ptBalance,
  maxSlippagePercent: 4,
});

const sellTx = sellPtTx.transaction as any;
txHash = await walletClient.sendTransaction({
  ...sellTx,
  value: BigInt(sellTx.value || 0),
  gas: BigInt(sellTx.gas),
  maxFeePerGas: BigInt(sellTx.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(sellTx.maxPriorityFeePerGas),
});

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
  // Set new allowance if current underlying asset allowance for Pendle Router is insufficient
  const setAllowanceForUnderlyingAssetTx =
    await compassApiSDK.universal.genericAllowanceSet({
      chain: "arbitrum",
      sender: WALLET_ADDRESS,
      token: underlyingAssetAddress,
      contract: Contract.PendleRouter,
      amount: userPosition.underlyingTokenBalance,
    });

  const underlyingAllowanceTx = setAllowanceForUnderlyingAssetTx.transaction as any;
  const txHash = await walletClient.sendTransaction({
    ...underlyingAllowanceTx,
    value: BigInt(underlyingAllowanceTx.value || 0),
    gas: BigInt(underlyingAllowanceTx.gas),
    maxFeePerGas: BigInt(underlyingAllowanceTx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(underlyingAllowanceTx.maxPriorityFeePerGas),
  });

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
}
// SNIPPET END 11

// SNIPPET START 12
const buyYtTx = await compassApiSDK.pendle.pendleYt({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
  action: "BUY",
  token: underlyingAssetAddress,
  amountIn: userPosition.underlyingTokenBalance,
  maxSlippagePercent: 4,
});

const buyYtTransaction = buyYtTx.transaction as any;
txHash = await walletClient.sendTransaction({
  ...buyYtTransaction,
  value: BigInt(buyYtTransaction.value || 0),
  gas: BigInt(buyYtTransaction.gas),
  maxFeePerGas: BigInt(buyYtTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(buyYtTransaction.maxPriorityFeePerGas),
});
// SNIPPET END 12

// SNIPPET START 13
const redeemYieldTx = await compassApiSDK.pendle.pendleRedeemYield({
  chain: "arbitrum",
  sender: WALLET_ADDRESS,
  marketAddress,
});

const redeemTx = redeemYieldTx.transaction as any;
txHash = await walletClient.sendTransaction({
  ...redeemTx,
  value: BigInt(redeemTx.value || 0),
  gas: BigInt(redeemTx.gas),
  maxFeePerGas: BigInt(redeemTx.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(redeemTx.maxPriorityFeePerGas),
});

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

  const ytAllowanceTx = setAllowanceForPtTx.transaction as any;
  const txHash = await walletClient.sendTransaction({
    ...ytAllowanceTx,
    value: BigInt(ytAllowanceTx.value || 0),
    gas: BigInt(ytAllowanceTx.gas),
    maxFeePerGas: BigInt(ytAllowanceTx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(ytAllowanceTx.maxPriorityFeePerGas),
  });

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
  maxSlippagePercent: 4,
});

const sellYtTransaction = sellYtTx.transaction as any;
txHash = await walletClient.sendTransaction({
  ...sellYtTransaction,
  value: BigInt(sellYtTransaction.value || 0),
  gas: BigInt(sellYtTransaction.gas),
  maxFeePerGas: BigInt(sellYtTransaction.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(sellYtTransaction.maxPriorityFeePerGas),
});

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 16

// SNIPPET START 17
const UsdtBalance = await compassApiSDK.token.tokenBalance({
  chain: "arbitrum",
  token: "USDT",
  user: WALLET_ADDRESS,
});
// SNIPPET END 17

// SNIPPET START 18
const UsdtAllowance = await compassApiSDK.universal.genericAllowance({
  chain: "arbitrum",
  user: WALLET_ADDRESS,
  token: underlyingAssetAddress,
  contract: Contract.PendleRouter,
});

if (UsdtAllowance.amount < UsdtBalance.amount) {
  // Set new allowance if current USDT allowance for Pendle Router is insufficient
  const setAllowanceForUsdtTx =
    await compassApiSDK.universal.genericAllowanceSet({
      chain: "arbitrum",
      sender: WALLET_ADDRESS,
      token: "USDT",
      contract: Contract.PendleRouter,
      amount: UsdtBalance.amount,
    });

  const usdtAllowanceTx = setAllowanceForUsdtTx.transaction as any;
  const txHash = await walletClient.sendTransaction({
    ...usdtAllowanceTx,
    value: BigInt(usdtAllowanceTx.value || 0),
    gas: BigInt(usdtAllowanceTx.gas),
    maxFeePerGas: BigInt(usdtAllowanceTx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(usdtAllowanceTx.maxPriorityFeePerGas),
  });

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
  maxSlippagePercent: 4,
});

const supplyTx = supplyLiquidityTx.transaction as any;
txHash = await walletClient.sendTransaction({
  ...supplyTx,
  value: BigInt(supplyTx.value || 0),
  gas: BigInt(supplyTx.gas),
  maxFeePerGas: BigInt(supplyTx.maxFeePerGas),
  maxPriorityFeePerGas: BigInt(supplyTx.maxPriorityFeePerGas),
});

await publicClient.waitForTransactionReceipt({
  hash: txHash,
});
// SNIPPET END 19
