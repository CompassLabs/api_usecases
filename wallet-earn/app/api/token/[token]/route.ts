import { CHAIN } from "@/utils/constants";
import { getWalletAddress } from "@/utils/utils";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const walletAddress = getWalletAddress();

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
