import { DEFAULT_CHAIN, SUPPORTED_CHAINS, getRpcUrl, type SupportedChainId } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { type UnsignedTransaction } from "@compass-labs/api-sdk/models/components";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export async function POST(request: Request) {
  try {
    const { owner, eip712, signature, chain: requestChain } = await request.json();
    const chainId = (requestChain || DEFAULT_CHAIN) as SupportedChainId;
    const chainConfig = SUPPORTED_CHAINS[chainId];

    if (!owner || !eip712 || !signature) {
      return Response.json(
        { error: "Missing required parameters (owner, eip712, signature)" },
        { status: 400 }
      );
    }

    // Sponsor account - pays gas and submits transaction
    const sponsorAccount = privateKeyToAccount(
      process.env.GAS_SPONSOR_PK as `0x${string}`
    );

    const rpcUrl = getRpcUrl(chainId);

    const sponsorWalletClient = createWalletClient({
      account: sponsorAccount,
      chain: chainConfig.viemChain,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: chainConfig.viemChain,
      transport: http(rpcUrl),
    });

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
      serverURL: process.env.COMPASS_API_SERVER_URL,
    });

    // Prepare gas-sponsored transaction with user's signature
    const sponsorGasResponse = await compassApiSDK.gasSponsorship.gasSponsorshipPrepare({
      owner,
      chain: chainId,
      eip712: eip712 as any,
      signature,
      sender: sponsorAccount.address,
    });

    const sponsoredTransaction = sponsorGasResponse.transaction as UnsignedTransaction;

    if (!sponsoredTransaction) {
      return Response.json(
        { error: "No transaction returned from gasSponsorshipPrepare" },
        { status: 500 }
      );
    }

    // Sponsor signs and submits the transaction
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
      return Response.json(
        { error: "Deposit transaction reverted" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      txHash: depositTxHash,
    });
  } catch (error) {
    console.error("Error executing deposit:", error);

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to execute deposit" },
      { status: 500 }
    );
  }
}
