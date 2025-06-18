// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { http } from "viem";
import { createWalletClient } from "viem";
import dotenv from "dotenv";
import { SendTransactionRequest } from "viem";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string;

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
});

// SNIPPET END 1

// SNIPPET START 2
async function run() {
  const account = privateKeyToAccount(PRIVATE_KEY);

  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(RPC_URL),
  });

  // SNIPPET END 2

  // SNIPPET START 3
  const auth = await compassApiSDK.transactionBundler.bundlerAuthorization({
    chain: "ethereum:mainnet",
    sender: account.address,
  });

  console.log("auth", auth);

  // 2. Sign the authorization
  const signedAuth = await walletClient.signAuthorization({
    account,
    contractAddress: auth.address as `0x${string}`,
    nonce: auth.nonce,
  });

  console.log("signedAuth", signedAuth);

  // SNIPPET END 3

  // SNIPPET START 4
  // Then execute with the authorization
  const result = await compassApiSDK.transactionBundler.bundlerExecute({
      chain: "ethereum:mainnet",
      sender: account.address,
      signedAuthorization: {
          nonce: signedAuth.nonce,
          address: signedAuth.address,
          chainId: signedAuth.chainId,
          r: signedAuth.r,
          s: signedAuth.s,
          yParity: signedAuth.yParity as number
      },
      actions: [
          {
              body: {
                  actionType: "ALLOWANCE_INCREASE",
                  token: "WETH",
                  contractName: "UniswapV3Router",
                  amount: "1000",
              },
          },
          {
              body: {
                  actionType: "UNISWAP_BUY_EXACTLY",
                  amount: 1,
                  fee: "0.01",
                  maxSlippagePercent: 0.5,
                  tokenIn: "WETH",
                  tokenOut: "USDC",
                  wrapEth: true,
              }
          }
      ]
  });

  // SNIPPET END 4

  // SNIPPET START 5
  const tx = await walletClient.sendTransaction(result as unknown as SendTransactionRequest);
  console.log(tx);

  // SNIPPET END 5
}

run();
