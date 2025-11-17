import { CHAIN } from "@/utils/constants";
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { privateKeyToAccount } from "viem/accounts";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: `0x${string}` }> }
) {
  const { address } = await params;

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.COMPASS_API_KEY,
  });

  const vaultResponse = await compassApiSDK.erc4626Vaults.vaultsVault({
    chain: CHAIN,
    vaultAddress: address,
    userAddress: account.address,
  });

  return new Response(JSON.stringify(vaultResponse), {
    status: 200,
  });
}
