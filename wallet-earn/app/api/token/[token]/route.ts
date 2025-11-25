import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("wallet");

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ error: "Missing wallet address" }),
      { status: 400 }
    );
  }

  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.COMPASS_API_KEY,
  });

  const tokenBalance = compassApiSDK.token.tokenBalance({
    chain: CHAIN,
    token,
    user: walletAddress,
  });

  const tokenPrice = compassApiSDK.token.tokenPrice({
    chain: CHAIN,
    token,
  });

  const [tokenBalanceResponse, tokenPriceResponse] = await Promise.all([
    tokenBalance,
    tokenPrice,
  ]);

  console.log(token, tokenBalanceResponse.amount);

  return new Response(
    JSON.stringify({ ...tokenBalanceResponse, ...tokenPriceResponse }),
    {
      status: 200,
    }
  );
}
