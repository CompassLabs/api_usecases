import { DEFAULT_CHAIN, type SupportedChainId } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function POST(request: Request) {
  try {
    const { vaultAddress, amount, token, owner, isAll, chain: requestChain } = await request.json();
    const chain = (requestChain || DEFAULT_CHAIN) as SupportedChainId;

    if (!vaultAddress || !amount || !token || !owner || typeof isAll !== "boolean") {
      return Response.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    // Call earnManage with gas sponsorship enabled
    const withdraw = await compassApiSDK.earn.earnManage({
      owner,
      chain,
      venue: {
        type: "VAULT",
        vaultAddress,
      },
      action: "WITHDRAW",
      amount: isAll ? "ALL" : amount,
      gasSponsorship: true,
    });

    const eip712TypedData = withdraw.eip712;

    if (!eip712TypedData) {
      return Response.json(
        { error: "No EIP-712 typed data returned from earnManage" },
        { status: 500 }
      );
    }

    // Normalize types for viem compatibility
    const normalizedTypes = {
      EIP712Domain: (eip712TypedData.types as any).eip712Domain,
      SafeTx: (eip712TypedData.types as any).safeTx,
    };

    return Response.json({
      eip712: eip712TypedData,
      normalizedTypes,
      domain: eip712TypedData.domain,
      message: eip712TypedData.message,
    });
  } catch (error) {
    console.error("Error preparing withdraw:", error);

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to prepare withdraw" },
      { status: 500 }
    );
  }
}
