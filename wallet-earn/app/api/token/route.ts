import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing query parameters" }), {
      status: 400,
    });
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.COMPASS_API_KEY,
  });

  const tokenBalance = compassApiSDK.token.tokenBalance({
    chain: CHAIN,
    token,
    user: account.address,
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
