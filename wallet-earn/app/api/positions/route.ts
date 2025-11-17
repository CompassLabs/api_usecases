import { CHAIN } from "@/utils/constants";
import { getWalletAddress } from "@/utils/utils";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET() {
  try {
    const walletAddress = getWalletAddress();

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    // Fetch user's earn positions
    const positionsResponse = await compassApiSDK.earn.earnPositions({
      chain: CHAIN,
      userAddress: walletAddress,
      offset: 0,
      limit: 100,
      days: 30,
    });

    return new Response(JSON.stringify(positionsResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error fetching earn positions:", error);

    // If it's a validation error from the SDK, extract the raw response body
    if (error?.rawResponse) {
      console.log("Validation failed, extracting raw response body");
      try {
        const clonedResponse = error.rawResponse.clone();
        const rawData = await clonedResponse.json();
        return new Response(JSON.stringify(rawData), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (parseError) {
        console.error("Failed to parse raw response:", parseError);
      }
    }

    return new Response(
      JSON.stringify({
        error: "Failed to fetch earn positions",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
