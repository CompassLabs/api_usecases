import { DEFAULT_CHAIN, type SupportedChainId } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = (searchParams.get("chain") || DEFAULT_CHAIN) as SupportedChainId;

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
      serverURL: process.env.COMPASS_API_SERVER_URL,
    });

    // Call the SDK method - it will validate the response
    // SNIPPET START 1
    const vaultsResponse = await compassApiSDK.earn.earnVaults({
      chain,
      orderBy: "one_month_returns",
      direction: "desc",
      offset: 0,
      limit: 50,
    });
    // Log vault names and returns
    vaultsResponse.vaults.forEach((vault) => {
      const oneMonthAPY = vault.oneMonthReturns
        ? (parseFloat(vault.oneMonthReturns) * 100).toFixed(2)
        : "N/A";
      const threeMonthsAPY = vault.threeMonthsReturns
        ? (parseFloat(vault.threeMonthsReturns) * 100).toFixed(2)
        : "N/A";
      console.log(
        `${vault.name}: 1M APY: ${oneMonthAPY}%, 3M APY: ${threeMonthsAPY}%`
      );
    });
    // SNIPPET END 1
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
