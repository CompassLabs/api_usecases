import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { type UnsignedTransaction } from "@compass-labs/api-sdk/models/components";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export async function POST(request: Request) {
  try {
    const { vaultAddress, amount, token, isAll } = await request.json();

    if (!vaultAddress || !amount || !token || typeof isAll !== "boolean") {
      throw new Error("Missing body parameters.");
    }

    const account = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.RPC_URL),
    });

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.RPC_URL),
    });

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    const auth =
      await compassApiSDK.transactionBundler.transactionBundlerAuthorization({
        chain: CHAIN,
        sender: account.address,
      });

    const signedAuth = await walletClient.signAuthorization({
      account,
      contractAddress: auth.address as `0x${string}`,
      nonce: auth.nonce,
    });

    const withdrawWithFee =
      await compassApiSDK.transactionBundler.transactionBundlerExecute({
        chain: CHAIN,
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
              actionType: "VAULT_WITHDRAW",
              vaultAddress,
              amount: isAll ? "ALL" : amount,
            },
          },
          {
            // Extract 1% fee
            body: {
              actionType: "TOKEN_TRANSFER",
              to: "0xd92710ffFF5c6449ADc1b0B86283eb7dbF37567d",
              token,
              amount: amount * 0.01,
            },
          },
        ],
      });

    const transaction = withdrawWithFee.transaction as UnsignedTransaction;

    const withdrawWithFeeTxHash = await walletClient.sendTransaction({
      ...(transaction as any),
      value: BigInt(transaction.value),
      gas: BigInt(transaction.gas),
      maxFeePerGas: BigInt(transaction.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
    });

    const tx = await publicClient.waitForTransactionReceipt({
      hash: withdrawWithFeeTxHash,
    });

    console.log("tx", tx);

    if (tx.status !== "success") {
      throw new Error("Withdraw transaction reverted.");
    }

    return new Response("", {
      status: 200,
    });
  } catch (error) {
    console.log("error", error);
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    } else {
      return new Response("Error", {
        status: 400,
      });
    }
  }
}
