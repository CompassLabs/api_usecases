import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function POST(request: Request) {
  try {
    const { owner } = await request.json();

    if (!owner) {
      return Response.json(
        { error: "Missing owner address" },
        { status: 400 }
      );
    }

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    // Call Compass API to create earn account
    // The owner will also be the sender (they sign and submit the tx)
    const response = await compassApiSDK.earn.earnCreateAccount({
      chain: CHAIN,
      owner,
      sender: owner, // Owner sends the transaction themselves
      estimateGas: true,
    });

    return Response.json({
      transaction: response.transaction,
      earnAccountAddress: response.earnAccountAddress,
    });
  } catch (error) {
    console.error("Error creating earn account:", error);

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to create earn account" },
      { status: 500 }
    );
  }
}
