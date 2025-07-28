import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { http } from "viem";
import { createWalletClient } from "viem";
import dotenv from "dotenv";
import { SendTransactionRequest } from "viem";
import { base } from "viem/chains";

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
  const walletClient = createWalletClient({
    account: account,
    chain: base,
    transport: http(BASE_RPC_URL as string),
  });

  // Get unsigned set allowance tx
  const UnsignedTransaction1 = await compass.universal.allowanceSet({
    token: "USDC",
    contract: SPECIFIC_MORPHO_VAULT,
    amount: 0.1,
    chain: "base:mainnet",
    sender: WALLET_ADDRESS,
  });
  console.log(UnsignedTransaction1);

  // Sign and broadcast set allowance tx
  const tx1 = await walletClient.sendTransaction(
    UnsignedTransaction1 as unknown as SendTransactionRequest,
  );
  console.log(tx1);

  // Get unsigned morpho deposit tx
  const UnsignedTransaction2 = await compass.morpho.deposit({
    vaultAddress: SPECIFIC_MORPHO_VAULT,
    amount: 0.1,
    chain: "base:mainnet",
    sender: WALLET_ADDRESS,
  });
  console.log(UnsignedTransaction2);

  // Sign and broadcast morpho deposit tx
  const tx2 = await walletClient.sendTransaction(
    UnsignedTransaction2 as unknown as SendTransactionRequest,
  );
  console.log(tx2);
};

main();
