import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET() {
  try {
    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    // Call the SDK method - it will validate the response
    const vaultsResponse = await compassApiSDK.earn.earnVaults({
      chain: CHAIN,
      orderBy: "one_month_returns",
      direction: "desc",
      offset: 0,
      limit: 50,
    });

    return new Response(JSON.stringify(vaultsResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error fetching vaults:", error);

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
        error: "Failed to fetch vaults",
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
