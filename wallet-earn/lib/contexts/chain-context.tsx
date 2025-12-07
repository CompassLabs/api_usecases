"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  type SupportedChainId,
} from "@/utils/constants";

interface ChainContextValue {
  chainId: SupportedChainId;
  chain: (typeof SUPPORTED_CHAINS)[SupportedChainId];
  setChain: (chainId: SupportedChainId) => void;
  supportedChains: typeof SUPPORTED_CHAINS;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<SupportedChainId>(DEFAULT_CHAIN);

  const setChain = useCallback((newChainId: SupportedChainId) => {
    setChainId(newChainId);
  }, []);

  const value: ChainContextValue = {
    chainId,
    chain: SUPPORTED_CHAINS[chainId],
    setChain,
    supportedChains: SUPPORTED_CHAINS,
  };

  return (
    <ChainContext.Provider value={value}>{children}</ChainContext.Provider>
  );
}

export function useChain() {
  const context = useContext(ChainContext);

  if (!context) {
    // Return default values for SSR/build
    return {
      chainId: DEFAULT_CHAIN,
      chain: SUPPORTED_CHAINS[DEFAULT_CHAIN],
      setChain: () => {},
      supportedChains: SUPPORTED_CHAINS,
    };
  }

  return context;
}
