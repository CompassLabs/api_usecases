import { ChevronLeft, Inbox } from "lucide-react";
import { Screen, Token, TokenData, VaultData } from "./Screens";
import { Loading } from "@geist-ui/core";
import React from "react";
import { addTokenTotal, cn } from "@/utils/utils";
import { motion } from "motion/react";
import EarnItem from "./EarnItem";
import Skeleton from "./primitives/Skeleton";

export default function TokenScreen({
  setScreen,
  tokenSymbol,
  tokenData,
  vaultData,
  handleRefresh,
}: {
  setScreen: (screen: Screen) => void;
  tokenSymbol: Token;
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
        <h1 className="relative text-5xl font-bold mb-2 font-sans tracking-tighter">
          {tokenData && vaultData ? (
            <>
              <span className="absolute top-1/2 -translate-y-1/2 -translate-x-full -left-0.5 text-3xl">
                $
              </span>
              {(
                addTokenTotal(tokenData, vaultData) * Number(tokenData.price)
              ).toFixed(2)}
            </>
          ) : (
            <Skeleton className="w-32 h-10 rounded-xl" />
          )}
        </h1>
        <div className="p-px shadow-inner shadow-neutral-300 rounded-full mb-2">
          <img
            src={`/${tokenSymbol}.${tokenSymbol !== "cbBTC" ? "svg" : "webp"}`}
            className="w-14 h-14 rounded-full outline outline-offset-[-1px] outline-neutral-900/20"
          />
        </div>
        <div className="font-medium text-neutral-500 flex">
          {tokenData && vaultData ? (
            addTokenTotal(tokenData, vaultData).toFixed(3)
          ) : (
            <Skeleton className="w-10 mr-1 h-3" />
          )}{" "}
          {tokenSymbol}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-1">
          <h2 className="text-2xl font-sans font-semibold">Earn</h2>
          <p className="text-neutral-500 text-sm">
            You can earn yield on your idle crypto by staking it!
          </p>
        </div>
        {tokenData && vaultData && vaultData.length > 0 ? (
          <ul className="flex flex-col gap-2 -mx-3 pt-3 pb-3 px-3">
            {tokenData &&
              vaultData?.map((vD) => (
                <EarnItem
                  vaultData={vD}
                  token={tokenData}
                  key={vD.symbol}
                  setIsOpen={setIsOpen}
                  handleRefresh={handleRefresh}
                />
              ))}
          </ul>
        ) : (
          <div className="w-full flex flex-col justify-center items-center my-auto">
            {vaultData?.length === 0 ? (
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
