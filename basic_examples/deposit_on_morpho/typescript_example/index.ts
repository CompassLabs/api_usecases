// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, base, arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";
import dotenv from "dotenv";

dotenv.config();

const main = async () => {


  const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
  const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
  const SPECIFIC_MORPHO_VAULT = process.env
    .SPECIFIC_MORPHO_VAULT as `0x${string}`;
  const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
  const compass = new CompassApiSDK({ apiKeyAuth: COMPASS_API_KEY });
  const account = privateKeyToAccount(PRIVATE_KEY);
  //...}
  // SNIPPET END 1




  // SNIPPET START 2

  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.COMPASS_API_KEY,
  });

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



  // SNIPPET START 2
  // Get unsigned set allowance tx
  
  const UnsignedTx1 = await compass.universal.allowanceSet({
    token: "USDC",
    contract: SPECIFIC_MORPHO_VAULT,
    amount: 0.2,
    chain: "base:mainnet",
    sender: WALLET_ADDRESS,
  });
  console.log(UnsignedTx1);
  // SNIPPET END 2

  // SNIPPET START 3
  // Sign and broadcast set allowance tx and wait for confirmation
  const txHash1 = await walletClient.sendTransaction(
    UnsignedTx1 as any
  );
  console.log(txHash1);

  // wait for confirmation
  await publicClient.waitForTransactionReceipt({
    hash: txHash1,
  });
  console.log("allowance tx completed")
  // SNIPPET END 3

  // SNIPPET START 4
  // Get unsigned morpho deposit tx
  const UnsignedTx2 = await compass.morpho.deposit({
    vaultAddress: SPECIFIC_MORPHO_VAULT,
    amount: 0.1,
    chain: "base:mainnet",
    sender: WALLET_ADDRESS,
  });
  console.log(UnsignedTx2);
  // SNIPPET START 4

  // SNIPPET START 5
  // Sign and broadcast morpho deposit tx
  const txHash2 = await walletClient.sendTransaction(
    UnsignedTx2 as any
  );
  console.log(txHash2);
    // wait for confirmation
  await publicClient.waitForTransactionReceipt({
    hash: txHash2,
  });
  console.log("deposit tx completed")
  // SNIPPET START 5
     
};

main();

