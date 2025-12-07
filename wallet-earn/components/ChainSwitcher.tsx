"use client";

import React from "react";
import { ChevronDown, Check } from "lucide-react";
import { useChain } from "@/lib/contexts/chain-context";
import { cn } from "@/utils/utils";
import type { SupportedChainId } from "@/utils/constants";

export default function ChainSwitcher() {
  const { chainId, chain, setChain, supportedChains } = useChain();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChainSelect = (newChainId: SupportedChainId) => {
    if (newChainId !== chainId) {
      setChain(newChainId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
      >
        <ChainIcon chainId={chainId} />
        <span className="text-sm font-medium text-neutral-700">
          {chain.name}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-neutral-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl border border-neutral-200 shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {Object.entries(supportedChains).map(([id, chainInfo]) => (
              <button
                key={id}
                onClick={() => handleChainSelect(id as SupportedChainId)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors",
                  chainId === id && "bg-neutral-50"
                )}
              >
                <ChainIcon chainId={id as SupportedChainId} />
                <span className="text-sm font-medium text-neutral-700 flex-1">
                  {chainInfo.name}
                </span>
                {chainId === id && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChainIcon({ chainId }: { chainId: SupportedChainId }) {
  // Using colored circles as fallback icons
  const colors: Record<SupportedChainId, string> = {
    base: "bg-blue-500",
    ethereum: "bg-indigo-500",
    arbitrum: "bg-sky-400",
  };

  return (
    <div className={cn("w-5 h-5 rounded-full", colors[chainId])} />
  );
}
