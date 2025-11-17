import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { type UnsignedTransaction } from "@compass-labs/api-sdk/models/components";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export async function POST(request: Request) {
  try {
    const { vaultAddress, amount, token } = await request.json();

    if (!vaultAddress || !amount || !token) {
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

    const allowance = await compassApiSDK.universal.genericAllowance({
      chain: CHAIN,
      user: account.address,
      token,
      contract: vaultAddress,
    });

    if (Number(allowance.amount) < amount) {
      const allowance = await compassApiSDK.universal.genericAllowanceSet({
        chain: CHAIN,
        sender: account.address,
        contract: vaultAddress,
        amount,
        token,
      });

      const transaction = allowance.transaction as UnsignedTransaction;

      const setAllowanceTxHash = await walletClient.sendTransaction({
        ...(transaction as any),
        value: BigInt(transaction.value),
        gas: BigInt(transaction.gas),
        maxFeePerGas: BigInt(transaction.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
      });

      const tx = await publicClient.waitForTransactionReceipt({
        hash: setAllowanceTxHash,
      });

      if (tx.status !== "success") {
        throw new Error("Allowance transaction reverted.");
      }
    }

    const deposit = await compassApiSDK.erc4626Vaults.vaultsDeposit({
      chain: CHAIN,
      sender: account.address,
      vaultAddress,
      amount,
    });

    const transaction = deposit.transaction as UnsignedTransaction;

    const depositTxHash = await walletClient.sendTransaction({
      ...(transaction as any),
      value: BigInt(transaction.value),
      gas: BigInt(transaction.gas),
      maxFeePerGas: BigInt(transaction.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
    });

    const tx = await publicClient.waitForTransactionReceipt({
      hash: depositTxHash,
    });

    if (tx.status !== "success") {
      throw new Error("Deposit transaction reverted.");
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
