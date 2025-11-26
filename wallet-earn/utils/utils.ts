import { TokenData } from "@/components/Screens";
import { EnrichedVaultData } from "@/components/TokenScreen";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the Compass Wallet address from environment variables
 * @throws {Error} If COMPASS_WALLET_ADDRESS is not set or invalid
 * @returns The validated wallet address
 */
export function getWalletAddress(): `0x${string}` {
  const address = process.env.COMPASS_WALLET_ADDRESS;

  if (!address) {
    throw new Error("COMPASS_WALLET_ADDRESS not set in environment variables");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid COMPASS_WALLET_ADDRESS format. Expected 0x followed by 40 hex characters");
  }

  return address as `0x${string}`;
}

export function generateWalletGradient(walletAddress: `0x${string}`) {
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return "linear-gradient(to right, hsl(0, 0%, 80%), hsl(0, 0%, 60%))";
  }

  const hash = walletAddress
    .slice(2)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;

  const saturation = 70;
  const lightness = 50;

  const color1 = `hsl(${hue1}, ${saturation}%, ${lightness}%)`;
  const color2 = `hsl(${hue2}, ${saturation}%, ${lightness}%)`;

  return `linear-gradient(to right, ${color1}, ${color2})`;
}

export const addTokenTotal = (tokenData: TokenData, vaultData: EnrichedVaultData[]) =>
  vaultData
    .filter((vD) => vD.denomination === tokenData.tokenSymbol)
    .reduce(
      (sum, vD) => sum + Number(vD?.userPosition?.amountInUnderlyingToken) || 0,
      0
    ) + Number(tokenData.amount);

export const addTotalBalance = (
  tokenData: TokenData[],
  vaultData: EnrichedVaultData[]
) =>
  tokenData.reduce((sum, token) => {
    const tokenSingle = tokenData?.find(
      (tD) => tD.tokenSymbol == token.tokenSymbol
    ) as TokenData;
    const tokenTotal = addTokenTotal(tokenSingle, vaultData);
    return sum + tokenTotal * Number(token.price);
  }, 0);

/**
 * Calculate total token amount (wallet only) for a specific token
 */
export function calculateTokenAmount(
  tokenData: TokenData | undefined,
  enrichedVaults: EnrichedVaultData[]
): number {
  if (!tokenData) return 0;

  const walletAmount = Number(tokenData.amount);

  return walletAmount;
}
