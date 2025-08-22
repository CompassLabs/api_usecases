import { ChevronLeft } from "lucide-react";
import { Screen, TokenData, VaultData } from "./Screens";
import { Spinner } from "@geist-ui/core";
import React from "react";
import { addTokenTotal, cn } from "@/utils/utils";

import EarnItem from "./EarnItem";
import Skeleton from "./primitives/Skeleton";

export default function TokenScreen({
  setScreen,
  tokenData,
  vaultData,
  handleRefresh,
}: {
  setScreen: (screen: Screen) => void;
  tokenData?: TokenData;
  vaultData?: VaultData[];
  handleRefresh: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col h-full duration-300",
        isOpen && "scale-[0.97] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      )}
    >
      <div className="flex flex-col items-center justify-end flex-2 relative">
        <div className="absolute inset-x-0 h-14 bottom-0 translate-y-full bg-gradient-to-b from-neutral-50 via-neutral-50 via-30% to-transparent" />
        <h1 className="text-5xl font-bold mb-2 font-sans tracking-tighter">
          {tokenData && vaultData ? (
            `$${(
              addTokenTotal(tokenData, vaultData) * Number(tokenData.price)
            ).toFixed(2)}`
          ) : (
            <Skeleton className="w-32 h-10" />
          )}
        </h1>
        <div className="p-px shadow-inner shadow-neutral-300 rounded-full mb-2">
          <img
            src={`/${tokenData?.tokenSymbol}.${
              tokenData?.tokenSymbol !== "cbBTC" ? "svg" : "webp"
            }`}
            className="w-14 h-14 rounded-full outline outline-offset-[-1px] outline-neutral-900/20"
          />
        </div>
        <div className="font-medium text-neutral-500 flex">
          {tokenData && vaultData ? (
            addTokenTotal(tokenData, vaultData).toFixed(3)
          ) : (
            <Skeleton className="w-10 mr-1 h-3" />
          )}{" "}
          {tokenData?.tokenSymbol}
        </div>
      </div>
      <button
        className="absolute top-3 left-0 p-2 rounded-full hover:bg-neutral-100 duration-200 cursor-pointer"
        onClick={() => {
          console.log("isOpen", isOpen);
          !isOpen && setScreen(Screen.Wallet);
        }}
      >
        <ChevronLeft size={28} />
      </button>
      <div
        className="overflow-y-auto overflow-x-hidden flex-3 pt-14"
        style={{
          scrollbarWidth: "none",
        }}
      >
        <div className="px-1">
          <h2 className="text-2xl font-sans font-semibold">Earn</h2>
          <p className="text-neutral-500 text-sm">
            You can earn yield on your idle crypto by staking it!
          </p>
        </div>
        <ul
          className={cn(
            "flex flex-col gap-2 -mx-3 pt-3 pb-3 px-3 ",
            !vaultData && "h-full"
          )}
        >
          {(tokenData &&
            vaultData?.map((vD) => (
              <EarnItem
                vaultData={vD}
                token={tokenData}
                key={vD.symbol}
                setIsOpen={setIsOpen}
                handleRefresh={handleRefresh}
              />
            ))) || (
            <div className="w-full flex justify-center items-center my-auto">
              <Spinner className="opacity-50" />
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
