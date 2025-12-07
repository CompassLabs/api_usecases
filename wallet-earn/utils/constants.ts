import { base, arbitrum, mainnet } from "viem/chains";

// Supported chains for Compass Earn
export const SUPPORTED_CHAINS = {
  base: {
    id: "base",
    name: "Base",
    viemChain: base,
    icon: "/chains/base.png",
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    viemChain: mainnet,
    icon: "/chains/ethereum.svg",
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum",
    viemChain: arbitrum,
    icon: "/chains/arbitrum.png",
  },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

// Helper to get chain-specific RPC URL (server-side)
export function getRpcUrl(chainId: SupportedChainId): string {
  const envKeys: Record<SupportedChainId, string> = {
    base: "RPC_URL_BASE",
    ethereum: "RPC_URL_ETHEREUM",
    arbitrum: "RPC_URL_ARBITRUM",
  };

  // Try chain-specific env var first, then fall back to generic RPC_URL
  return process.env[envKeys[chainId]] || process.env.RPC_URL || "";
}

// Helper to get chain-specific RPC URL (client-side)
// Uses NEXT_PUBLIC_ prefixed env vars which are exposed to the browser
export function getClientRpcUrl(chainId: SupportedChainId): string | undefined {
  const envKeys: Record<SupportedChainId, string | undefined> = {
    base: process.env.NEXT_PUBLIC_RPC_URL_BASE,
    ethereum: process.env.NEXT_PUBLIC_RPC_URL_ETHEREUM,
    arbitrum: process.env.NEXT_PUBLIC_RPC_URL_ARBITRUM,
  };

  // Try chain-specific env var first, then fall back to generic NEXT_PUBLIC_RPC_URL
  // Return undefined to let viem use the chain's default public RPC
  return envKeys[chainId] || process.env.NEXT_PUBLIC_RPC_URL || undefined;
}

// Default chain
export const DEFAULT_CHAIN: SupportedChainId = "base";

// Legacy export for backwards compatibility
export const CHAIN = DEFAULT_CHAIN;
