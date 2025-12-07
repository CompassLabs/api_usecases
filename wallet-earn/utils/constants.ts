import { base, arbitrum, mainnet } from "viem/chains";

// Supported chains for Compass Earn
export const SUPPORTED_CHAINS = {
  base: {
    id: "base",
    name: "Base",
    viemChain: base,
    icon: "/chains/base.svg",
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
    icon: "/chains/arbitrum.svg",
  },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

// Default chain
export const DEFAULT_CHAIN: SupportedChainId = "base";

// Legacy export for backwards compatibility
export const CHAIN = DEFAULT_CHAIN;
