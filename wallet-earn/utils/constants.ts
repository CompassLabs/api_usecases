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

// Helper to get chain-specific RPC URL
export function getRpcUrl(chainId: SupportedChainId): string {
  const envKeys: Record<SupportedChainId, string> = {
    base: "RPC_URL_BASE",
    ethereum: "RPC_URL_ETHEREUM",
    arbitrum: "RPC_URL_ARBITRUM",
  };

  // Try chain-specific env var first, then fall back to generic RPC_URL
  return process.env[envKeys[chainId]] || process.env.RPC_URL || "";
}

// Default chain
export const DEFAULT_CHAIN: SupportedChainId = "base";

// Legacy export for backwards compatibility
export const CHAIN = DEFAULT_CHAIN;
