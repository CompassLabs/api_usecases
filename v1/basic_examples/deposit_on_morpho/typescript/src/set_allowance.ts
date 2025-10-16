import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { SafeProvider } from '@safe-global/protocol-kit';
import { createSafeClient } from '@safe-global/sdk-starter-kit';



dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
const DEPOSIT_AMOUNT = 0.02; // amount the user will deposit in a Morpho vault
const SPECIFIC_MORPHO_VAULT = process.env
  .SPECIFIC_MORPHO_VAULT as `0x${string}` || "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738";
const BASE_MAINNET_RPC_URL = process.env.BASE_MAINNET_RPC_URL as SafeProvider['provider'];
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as string;
const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS as string;
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS as string;


const compass = new CompassApiSDK({
  apiKeyAuth: COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined, // For internal testing purposes. You do not need to set this.
});


// Get ETH price in USD
const ethPrice = await compass.token.tokenPrice({
  chain: "ethereum",
  token: "ETH",
});

/////////////////////////////////////////////////////////////////

const result = await compass.token.tokenBalance({
  chain: "base",
  user: SAFE_ADDRESS,
  token: "ETH",
});
console.log(result);

// SNIPPET START 2

const safeClient = await createSafeClient({
  provider: BASE_MAINNET_RPC_URL,
  signer: SIGNER_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS,
});

console.log('Safe client created at:', await safeClient.getAddress());


const WALLET_ADDRESS = await safeClient.getAddress();






const allowanceTx = await compass.universal.genericAllowanceSet({
  chain: "base",
  sender: SAFE_ADDRESS,
  contract: SPECIFIC_MORPHO_VAULT, // seamless USDC Vault.
  amount: 10000,
  token: "USDC",
});
console.log("allowanceTx", allowanceTx);


const allowanceTransactions = Array.isArray(allowanceTx)
  ? allowanceTx
  : Array.isArray((allowanceTx as any)?.transactions)
    ? (allowanceTx as any).transactions
    : [(allowanceTx as any).transaction];

const operations = allowanceTransactions.map((op: { to: string; data: string; value?: string }) => ({
  to: op.to as `0x${string}`,
  data: op.data as `0x${string}`,
  value: op.value ? BigInt(op.value).toString() : '0',
}));

try {
  const txResult = await safeClient.send({transactions: operations});
    console.log('txResult', txResult);
  console.log('txResult.status', txResult.status);
  console.log(txResult.transactions?.ethereumTxHash);
}
catch (error) {
  console.error("Ran into an error:", error);
  console.log("Ran into expected error. Wallet not funded");
}

// // SNIPPET END 23

// SNIPPET START 24
// Sign and broadcast unsigned allowance transaction
// const allowanceTransaction = allowanceTx.transaction as any;
// const allowanceTxHash = await walletClient.sendTransaction({
//   ...allowanceTransaction,
//   value: BigInt(allowanceTransaction.value || 0),
//   gas: BigInt(allowanceTransaction.gas),
//   maxFeePerGas: BigInt(allowanceTransaction.maxFeePerGas),
//   maxPriorityFeePerGas: BigInt(allowanceTransaction.maxPriorityFeePerGas),
// });
// console.log("Set allowance tx hash:", allowanceTxHash);
// const allowanceTxReceipt = await publicClient.waitForTransactionReceipt({
//   hash: allowanceTxHash,
// });

// if (allowanceTxReceipt.status !== "success") {
//   throw Error();
// }
// SNIPPET END 24

// SNIPPET START 25
// DEPOSIT ON MORPHO
// Get unsigned Morpho Deposit Transaction from the Compass API
// const morphoDepositTx = await compass.morpho.morphoDeposit({
//   chain: "base",
//   sender: WALLET_ADDRESS,
//   vaultAddress: SPECIFIC_MORPHO_VAULT, // seamless USDC Vault.
//   amount: DEPOSIT_AMOUNT,
// });
// console.log("Morpho Deposit Tx", morphoDepositTx);
// SNIPPET END 25

// SNIPPET START 26
// Sign and broadcast unsigned Morpho Deposit transaction
// const morphoDepositTransaction = morphoDepositTx.transaction as any;
// const morphoDepositTxHash = await walletClient.sendTransaction({
//   ...morphoDepositTransaction,
//   value: BigInt(morphoDepositTransaction.value || 0),
//   gas: BigInt(morphoDepositTransaction.gas),
//   maxFeePerGas: BigInt(morphoDepositTransaction.maxFeePerGas),
//   maxPriorityFeePerGas: BigInt(morphoDepositTransaction.maxPriorityFeePerGas),
// });

// const morphoDepositTxReceipt = await publicClient.waitForTransactionReceipt({
//   hash: morphoDepositTxHash,
// });

// if (morphoDepositTxReceipt.status !== "success") {
//   throw Error();
// }

// console.log("Morpho deposit tx hash:", morphoDepositTxHash);

// SNIPPET END 26
