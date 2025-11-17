import { CHAIN } from "@/utils/constants";
import { getWalletAddress } from "@/utils/utils";
import { CompassApiSDK } from "@compass-labs/api-sdk";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: `0x${string}` }> }
) {
  const { address } = await params;

  const walletAddress = getWalletAddress();

  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.COMPASS_API_KEY,
  });

  const vaultResponse = await compassApiSDK.erc4626Vaults.vaultsVault({
    chain: CHAIN,
    vaultAddress: address,
    userAddress: walletAddress,
  });

  return new Response(JSON.stringify(vaultResponse), {
    status: 200,
  });
}
