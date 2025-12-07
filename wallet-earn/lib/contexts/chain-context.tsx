"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  type SupportedChainId,
} from "@/utils/constants";

const CHAIN_STORAGE_KEY = "compass-earn-chain";

interface ChainContextValue {
  chainId: SupportedChainId;
  chain: (typeof SUPPORTED_CHAINS)[SupportedChainId];
  setChain: (chainId: SupportedChainId) => void;
  supportedChains: typeof SUPPORTED_CHAINS;
}

const ChainContext = createContext<ChainContextValue | null>(null);

// Helper to get stored chain from localStorage
function getStoredChain(): SupportedChainId {
  if (typeof window === "undefined") return DEFAULT_CHAIN;

  const stored = localStorage.getItem(CHAIN_STORAGE_KEY);
  if (stored && stored in SUPPORTED_CHAINS) {
    return stored as SupportedChainId;
  }
  return DEFAULT_CHAIN;
}

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<SupportedChainId>(DEFAULT_CHAIN);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load persisted chain on mount (client-side only)
  useEffect(() => {
    const storedChain = getStoredChain();
    setChainId(storedChain);
    setIsHydrated(true);
  }, []);

  const setChain = useCallback((newChainId: SupportedChainId) => {
    setChainId(newChainId);
    // Persist to localStorage
    localStorage.setItem(CHAIN_STORAGE_KEY, newChainId);
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
