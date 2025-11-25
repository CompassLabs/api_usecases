import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");

    if (!owner) {
      return Response.json(
        { error: "Missing owner address" },
        { status: 400 }
      );
    }

    const compassApiSDK = new CompassApiSDK({
      apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    // Try to create account - if it returns 400, account already exists
    try {
      const response = await compassApiSDK.earn.earnCreateAccount({
        chain: CHAIN,
        owner,
        sender: owner,
        estimateGas: false,
      });

      const earnAccountAddress = response.earnAccountAddress;

      // Check if account is already deployed by checking bytecode
      const bytecode = await publicClient.getCode({
        address: earnAccountAddress as `0x${string}`,
      });

      const isDeployed = bytecode !== undefined && bytecode !== "0x";

      return Response.json({
        earnAccountAddress,
        isDeployed,
      });
    } catch (sdkError: any) {
      // If SDK returns 400, account already exists - this means it's deployed
      // Try to extract the earn account address from the error or response
      console.log("SDK error checking earn account:", sdkError);

      // Check if it's a 400 error (account already exists)
      const statusCode = sdkError?.statusCode || sdkError?.status;
      if (statusCode === 400) {
        // Account exists - try to get the address from the error body
        const errorBody = sdkError?.body || sdkError?.rawResponse;
        let earnAccountAddress = null;

        // Try to parse earn_account_address from error response
        if (typeof errorBody === "string") {
          try {
            const parsed = JSON.parse(errorBody);
            earnAccountAddress = parsed.earn_account_address || parsed.earnAccountAddress;
          } catch {
            // Ignore parse errors
          }
        } else if (errorBody?.earn_account_address) {
          earnAccountAddress = errorBody.earn_account_address;
        }

        return Response.json({
          earnAccountAddress,
          isDeployed: true, // 400 means account already exists
        });
      }

      return Response.json({
        earnAccountAddress: null,
        isDeployed: false,
        error: "Could not determine earn account status",
      });
    }
  } catch (error) {
    console.error("Error checking earn account:", error);

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "Failed to check earn account" },
      { status: 500 }
    );
  }
}
