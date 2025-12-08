import { DEFAULT_CHAIN, type SupportedChainId } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function POST(request: Request) {
  try {
    const {
      vaultAddress,
      amountIn,
      tokenIn,
      tokenOut,
      slippage,
      owner,
      chain: requestChain,
    } = await request.json();
    const chain = (requestChain || DEFAULT_CHAIN) as SupportedChainId;

    if (!vaultAddress || !amountIn || !tokenIn || !tokenOut || !owner) {
      return Response.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
      serverURL: process.env.COMPASS_API_SERVER_URL,
    });

    // Create a bundle with two actions:
    // 1. Swap tokenIn (e.g., USDC) to tokenOut (e.g., AUSD)
    // 2. Deposit tokenOut into the vault
    const bundleResponse = await compassApiSDK.earn.earnBundle({
      owner,
      chain,
      gasSponsorship: true,
      actions: [
        {
          body: {
            actionType: "V2_SWAP",
            tokenIn,
            tokenOut,
            amountIn,
            slippage: String(slippage || 0.5), // Default 0.5% slippage
          },
        },
        {
          body: {
            actionType: "V2_MANAGE",
            venue: {
              type: "VAULT",
              vaultAddress,
            },
            action: "DEPOSIT",
            amount: String(Number(amountIn) * 0.99) // Deposit all the swapped tokens
          },
        },
      ],
    });

    const eip712TypedData = bundleResponse.eip712;

    if (!eip712TypedData) {
      return Response.json(
        { error: "No EIP-712 typed data returned from earnBundle" },
        { status: 500 }
      );
    }

    // Normalize types for viem compatibility
    // SDK returns camelCase keys (safeTx, eip712Domain) but primaryType as "SafeTx"
    const normalizedTypes = {
      EIP712Domain: (eip712TypedData.types as any).eip712Domain,
      SafeTx: (eip712TypedData.types as any).safeTx,
    };

    return Response.json({
      eip712: eip712TypedData,
      normalizedTypes,
      domain: eip712TypedData.domain,
      message: eip712TypedData.message,
      actionsCount: bundleResponse.actionsCount,
    });
  } catch (error) {
    console.error("Error preparing bundle:", error);

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to prepare bundle" },
      { status: 500 }
    );
  }
}
