import { DEFAULT_CHAIN, type SupportedChainId } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = (searchParams.get("chain") || DEFAULT_CHAIN) as SupportedChainId;
    const depositToken = searchParams.get("deposit_token") || "AUSD";

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
      serverURL: process.env.COMPASS_API_SERVER_URL,
    });

    // Call the Morpho vaults endpoint filtered by deposit token
    const vaultsResponse = await compassApiSDK.morpho.morphoVaults({
      chain,
      depositToken,
    });

    return new Response(JSON.stringify(vaultsResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error fetching morpho vaults:", error);

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
        error: "Failed to fetch morpho vaults",
        details: error instanceof Error ? error.message : String(error),
        vaults: [], // Return empty array so frontend can handle gracefully
      }),
      {
        status: 200, // Return 200 with empty vaults so UI handles gracefully
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
