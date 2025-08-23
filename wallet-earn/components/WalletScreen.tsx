import React from "react";
import { Screen, Token, TokenData, VaultData } from "./Screens";
import { addTokenTotal, addTotalBalance } from "@/utils/utils";
import Skeleton from "./primitives/Skeleton";

export default function WalletScreen({
  setScreen,
  setToken,
  tokenData,
  vaultData,
}: {
  setScreen: (screen: Screen) => void;
  setToken: (token: Token) => void;
  tokenData?: TokenData[];
  vaultData?: VaultData[];
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col justify-center items-center h-full">
        <div className="text-5xl font-bold font-sans">
          {tokenData && vaultData ? (
            `$${addTotalBalance(tokenData, vaultData).toFixed(2)}`
          ) : (
            <Skeleton className="w-32 h-10" />
          )}
        </div>
        <div className="text-neutral-400 -mt-0.5">Total value</div>
      </div>
      <ul className="flex flex-col gap-2 mt-auto w-full pb-4">
        {tokenData?.map((t) => {
          const tokenTotal = vaultData ? addTokenTotal(t, vaultData) : 0; // total (wallet + staked)
          const tokenUsd = tokenTotal * Number(t.price);

          // best-effort estimate of wallet-only amount; falls back to 0 if unknown
          const walletAmt = Number(
            (t as any).walletBalance ??
              (t as any).balance ??
              (t as any).amount ??
              0
          );
          const vaultAmt = Math.max(0, tokenTotal - walletAmt);
          const stakedPct =
            tokenTotal > 0 ? Math.min(100, (vaultAmt / tokenTotal) * 100) : 0;

          return (
            <li
              key={t.tokenAddress}
              className="relative w-full bg-white rounded-xl border border-neutral-100 flex items-center px-5 py-2 pb-7 shadow shadow-neutral-100 hover:scale-[1.01] duration-300 cursor-pointer hover:shadow-neutral-200"
              onClick={() => {
                setScreen(Screen.Token);
                setToken(t.tokenSymbol as Token);
              }}
            >
              <div className="p-px border border-neutral-200 rounded-full">
                <img
                  src={`/${t.tokenSymbol}.${
                    t.tokenSymbol !== "cbBTC" ? "svg" : "webp"
                  }`}
                  className="w-9 h-9 rounded-full"
                />
              </div>
              <div className="ml-4">
                <div className="font-semibold font-sans">{t.tokenSymbol}</div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <div className="font-semibold font-sans">
                  {vaultData ? (
                    `$${tokenUsd.toFixed(2)}`
                  ) : (
                    <Skeleton className="w-10 h-3 ml-1" />
                  )}
                </div>
                <div className="text-[13px] text-neutral-400">
                  {vaultData ? (
                    tokenTotal.toFixed(3)
                  ) : (
                    <Skeleton className="w-10 mr-1 bg-neutral-100/90" />
                  )}{" "}
                  {t.tokenSymbol}
                </div>
              </div>

              {/* bottom meta row + progress bar */}
              <div className="absolute bottom-0 left-0 right-0">
                <div className="mx-5 mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-neutral-400">
                    {vaultData ? `${stakedPct.toFixed(1)}% staked` : <>&nbsp;</>}
                  </span>
                  <span className="text-emerald-700 font-medium hover:underline">
                    Stake more
                  </span>
                </div>
                <div className="mx-5 mb-0.5 h-[2px] bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${stakedPct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        }) ||
          Object.keys(Token).map((token) => (
            <li
              key={token}
              className="relative w-full bg-white rounded-xl border border-neutral-100 flex items-center px-4 py-2 pb-7 shadow shadow-neutral-100 hover:scale-[1.01] duration-300 cursor-pointer hover:shadow-neutral-200"
            >
              <div className="p-px border border-neutral-200 rounded-full">
                <img
                  src={`/${token}.${token !== "cbBTC" ? "svg" : "webp"}`}
                  className="w-10 h-10 rounded-full"
                />
              </div>
              <div className="ml-4">
                <div className="font-medium">{token}</div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <div className="font-medium">
                  <Skeleton className="w-10 h-3 ml-1" />
                </div>
                <div className="text-sm text-neutral-400">
                  <Skeleton className="w-10 bg-neutral-100/90 mr-1" /> {token}
                </div>
              </div>

              {/* placeholder bottom meta and progress while loading */}
              <div className="absolute bottom-0 left-0 right-0">
                <div className="mx-4 mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-neutral-400">0.0% staked</span>
                  <span className="text-emerald-700 font-medium">Stake more</span>
                </div>
                <div className="mx-4 mb-0.5 h-[2px] bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-neutral-200" />
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
