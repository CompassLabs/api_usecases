import { ChevronLeft, Inbox, Search } from "lucide-react";
import { Screen, Token, TokenData } from "./Screens";
import {
  VaultsListResponse,
  EarnPositionsResponse,
  VaultInfo,
  CompassApiBackendV2ModelsEarnReadResponsePositionsVaultPosition,
} from "@compass-labs/api-sdk/models/components";
import { Loading } from "@geist-ui/core";
import React from "react";
import { cn, calculateTokenAmount } from "@/utils/utils";
import { motion } from "motion/react";
import EarnItem from "./EarnItem";
import Skeleton from "./primitives/Skeleton";

// Merged data type combining vault info and user position
export type EnrichedVaultData = VaultInfo & {
  userPosition?: CompassApiBackendV2ModelsEarnReadResponsePositionsVaultPosition;
};

export default function TokenScreen({
  setScreen,
  tokenSymbol,
  tokenData,
  vaultsListData,
  positionsData,
  handleRefresh,
}: {
  setScreen: (screen: Screen) => void;
  tokenSymbol: Token;
  tokenData?: TokenData;
  vaultsListData?: VaultsListResponse;
  positionsData?: EarnPositionsResponse;
  handleRefresh: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter vaults for this specific token and merge with user positions
  const enrichedVaults = React.useMemo<EnrichedVaultData[]>(() => {
    if (!vaultsListData) return [];

    const tokenVaults = vaultsListData.vaults.filter(
      (vault) => vault.denomination.toUpperCase() === tokenSymbol
    );

    // Merge with user positions
    return tokenVaults.map((vault) => {
      const userPosition = positionsData?.userPositions?.find(
        (pos) => pos.type === "VAULT" && pos.vaultAddress === vault.address
      ) as CompassApiBackendV2ModelsEarnReadResponsePositionsVaultPosition | undefined;

      return {
        ...vault,
        userPosition,
      };
    });
  }, [vaultsListData, positionsData, tokenSymbol]);

  // Filter vaults based on search query
  const filteredVaults = React.useMemo<EnrichedVaultData[]>(() => {
    if (!searchQuery.trim()) return enrichedVaults;
    const query = searchQuery.toLowerCase();
    return enrichedVaults.filter((vault) =>
      vault.name.toLowerCase().includes(query)
    );
  }, [enrichedVaults, searchQuery]);

  const totalAmount = React.useMemo(
    () => calculateTokenAmount(tokenData, enrichedVaults),
    [tokenData, enrichedVaults]
  );

  return (
    <div
      className={cn(
        "relative flex flex-col h-full duration-300",
        isOpen && "scale-[0.97] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      )}
    >
      <motion.button
        className="absolute z-10 top-4 left-0 p-2 rounded-full hover:bg-neutral-100 duration-200 cursor-pointer"
        onClick={() => {
          console.log("isOpen", isOpen);
          !isOpen && setScreen(Screen.Wallet);
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
        exit={{ opacity: 0, transition: { duration: 0.01 } }}
        // transition={{ delay: 0.2 }}
      >
        <ChevronLeft size={28} />
      </motion.button>
      <div className="flex-[0.9] flex flex-col items-center justify-center mt-4 relative">
        <div className="p-px shadow-inner shadow-neutral-300 rounded-full mb-2">
          <img
            src={`/${tokenSymbol}.${tokenSymbol === "cbBTC" ? "webp" : tokenSymbol === "AUSD" ? "png" : "svg"}`}
            className="w-14 h-14 rounded-full outline outline-offset-[-1px] outline-neutral-900/20"
          />
        </div>
        <div className="text-3xl font-bold font-sans tracking-tighter">
          {tokenData ? (
            totalAmount.toFixed(3)
          ) : (
            <Skeleton className="w-20 h-8 rounded-xl" />
          )}{" "}
          {tokenSymbol}
        </div>
        <div className="text-sm text-neutral-400">Available balance</div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-1">
          <h2 className="text-2xl font-sans font-semibold">Earn</h2>
          <p className="text-neutral-500 text-sm">
            You can earn yield on your idle crypto!
          </p>
        </div>
        {enrichedVaults && enrichedVaults.length > 0 && (
          <div className="relative mt-3 mb-2 px-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search vaults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
            />
          </div>
        )}
        {tokenData && enrichedVaults && enrichedVaults.length > 0 ? (
          filteredVaults.length > 0 ? (
            <ul className="flex flex-col gap-2 -mx-3 pt-3 pb-3 px-3">
              {filteredVaults.map((vault) => (
                <EarnItem
                  vaultData={vault}
                  token={tokenData}
                  key={vault.address}
                  setIsOpen={setIsOpen}
                  handleRefresh={handleRefresh}
                />
              ))}
            </ul>
          ) : (
            <div className="w-full flex flex-col justify-center items-center my-auto">
              <Search className="stroke-[0.4] text-zinc-400/70" size={48} />
              <div className="text-[13px] text-zinc-400 text-center mt-2">
                No vaults found matching "{searchQuery}"
              </div>
            </div>
          )
        ) : (
          <div className="w-full flex flex-col justify-center items-center my-auto">
            {enrichedVaults?.length === 0 ? (
              <>
                <Inbox className="stroke-[0.4] text-zinc-400/70" size={64} />
                <div className="text-[13px] text-zinc-400 text-center">
                  There are currently no {tokenData?.tokenSymbol}
                  <br /> earning oppurtunities.
                </div>
              </>
            ) : (
              <Loading className="opacity-60" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
