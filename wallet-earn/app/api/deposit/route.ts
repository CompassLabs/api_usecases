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

    // Owner account - signs EIP-712 typed data
    const ownerAccount = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );

    // Sponsor account - pays gas and submits transaction
    const sponsorAccount = privateKeyToAccount(
      process.env.GAS_SPONSOR_PK as `0x${string}`
    );

    const sponsorWalletClient = createWalletClient({
      account: sponsorAccount,
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

    // Step 1: Call earnManage with gas sponsorship enabled
    const deposit = await compassApiSDK.earn.earnManage({
      owner: ownerAccount.address,
      chain: CHAIN,
      venue: {
        type: "VAULT",
        vaultAddress,
      },
      action: "DEPOSIT",
      amount,
      gasSponsorship: true,
    });

    // Step 2: Extract EIP-712 typed data
    const eip712TypedData = deposit.eip712;

    if (!eip712TypedData) {
      throw new Error("No EIP-712 typed data returned from earnManage");
    }

    console.log("EIP-712 Typed Data:", eip712TypedData);

    // Step 3: Owner signs the EIP-712 typed data
    // Note: SDK returns camelCase keys (safeTx, eip712Domain) but primaryType as "SafeTx"
    // We need to normalize the types object to match what viem expects
    const normalizedTypes = {
      EIP712Domain: (eip712TypedData.types as any).eip712Domain,
      SafeTx: (eip712TypedData.types as any).safeTx,
    };

    const signature = await ownerAccount.signTypedData({
      domain: eip712TypedData.domain as any,
      types: normalizedTypes,
      primaryType: "SafeTx",
      message: eip712TypedData.message as any,
    });

    console.log("Owner Signature:", signature);

    // Step 4: Prepare gas-sponsored transaction
    const sponsorGasResponse = await compassApiSDK.gasSponsorship.gasSponsorshipPrepare({
      owner: ownerAccount.address,
      chain: CHAIN,
      eip712: eip712TypedData as any,
      signature,
      sender: sponsorAccount.address,
    });

    const sponsoredTransaction = sponsorGasResponse.transaction as UnsignedTransaction;

    if (!sponsoredTransaction) {
      throw new Error("No transaction returned from gasSponsorshipPrepare");
    }

    console.log("Sponsored Transaction:", sponsoredTransaction);

    // Step 5: Sponsor signs and submits the transaction
    const depositTxHash = await sponsorWalletClient.sendTransaction({
      ...(sponsoredTransaction as any),
      value: BigInt(sponsoredTransaction.value),
      gas: sponsoredTransaction.gas ? BigInt(sponsoredTransaction.gas) : undefined,
      maxFeePerGas: BigInt(sponsoredTransaction.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(sponsoredTransaction.maxPriorityFeePerGas),
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
