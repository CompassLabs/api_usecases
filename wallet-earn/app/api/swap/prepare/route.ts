import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function POST(request: Request) {
  try {
    const { owner, tokenIn, tokenOut, amountIn, slippage } = await request.json();

    if (!owner || !tokenIn || !tokenOut || !amountIn || slippage === undefined) {
      return Response.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    const swap = await compassApiSDK.earn.earnSwap({
      owner,
      chain: CHAIN,
      tokenIn,
      tokenOut,
      amountIn,
      slippage,
      gasSponsorship: true,
    });

    const eip712TypedData = swap.eip712;

    if (!eip712TypedData) {
      return Response.json(
        { error: "No EIP-712 typed data returned from earnSwap" },
        { status: 500 }
      );
    }

    const normalizedTypes = {
      EIP712Domain: (eip712TypedData.types as any).eip712Domain,
      SafeTx: (eip712TypedData.types as any).safeTx,
    };

    return Response.json({
      eip712: eip712TypedData,
      normalizedTypes,
      domain: eip712TypedData.domain,
      message: eip712TypedData.message,
      estimatedAmountOut: swap.estimatedAmountOut
    });
  } catch (error) {
    console.error("Error preparing swap:", error);

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to prepare swap" },
      { status: 500 }
    );
  }
}
