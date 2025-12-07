import { DEFAULT_CHAIN, type SupportedChainId } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");
    const chain = (searchParams.get("chain") || DEFAULT_CHAIN) as SupportedChainId;

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: "Missing wallet address" }),
        { status: 400 }
      );
    }

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
      serverURL: process.env.COMPASS_API_SERVER_URL,
    });

    // Fetch user's earn positions
    const positionsResponse = await compassApiSDK.earn.earnPositions({
      chain,
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
