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
        {tokenData?.map((t) => (
          <li
            key={t.tokenAddress}
            className="w-full bg-white rounded-xl border border-neutral-100 flex items-center px-5 py-2 shadow shadow-neutral-100 hover:scale-[1.01] duration-300 cursor-pointer hover:shadow-neutral-200"
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
                  `$${(addTokenTotal(t, vaultData) * Number(t.price)).toFixed(
                    2
                  )}`
                ) : (
                  <Skeleton className="w-10 h-3 ml-1" />
                )}
              </div>
              <div className="text-[13px] text-neutral-400">
                {vaultData ? (
                  addTokenTotal(t, vaultData).toFixed(3)
                ) : (
                  <Skeleton className="w-10 mr-1 bg-neutral-100/90" />
                )}{" "}
                {t.tokenSymbol}
              </div>
            </div>
            {true && (
              <div className="ml-4 border border-emerald-600/50 bg-emerald-400/5 px-1.5 rounded-full text-[12px] text-emerald-600/80 font-medium">
                Earn
              </div>
            )}
          </li>
        )) ||
          Object.keys(Token).map((token) => (
            <li
              key={token}
              className="w-full bg-white rounded-xl border border-neutral-100 flex items-center px-4 py-2 shadow shadow-neutral-100 hover:scale-[1.01] duration-300 cursor-pointer hover:shadow-neutral-200"
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
              {true && (
                <div className="ml-4 border border-emerald-600/50 bg-emerald-400/5 px-1.5 rounded-full text-[12px] text-emerald-600/80 font-medium">
                  Earn
                </div>
              )}
            </li>
          ))}
      </ul>
        <div className="flex justify-center -mt-1.5">
          <a
            href="https://github.com/CompassLabs/api_usecases/tree/main/wallet-earn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-neutral-200 underline"
          >
            Source code here
          </a>
        </div>
    </div>

  );
}
