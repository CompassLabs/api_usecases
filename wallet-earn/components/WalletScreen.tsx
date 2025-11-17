import React from "react";
import { Screen, Token, TokenData, vaultsByToken } from "./Screens";
import { VaultsListResponse } from "@compass-labs/api-sdk/models/components";
import Skeleton from "./primitives/Skeleton";

export default function WalletScreen({
  setScreen,
  setToken,
  tokenData,
  vaultsListData,
}: {
  setScreen: (screen: Screen) => void;
  setToken: (token: Token) => void;
  tokenData?: TokenData[];
  vaultsListData?: VaultsListResponse;
}) {
  // Calculate total balance from token data only (wallet balances)
  const totalBalance = tokenData?.reduce((sum, token) => {
    return sum + (Number(token.amount) * Number(token.price));
  }, 0) || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col justify-center items-center h-full">
        <div className="relative text-5xl font-bold font-sans">
          {tokenData ? (
            <>
              <span className="absolute top-1/2 -translate-y-1/2 -translate-x-full -left-0.5 text-4xl">
                $
              </span>
              {totalBalance.toFixed(2)}
            </>
          ) : (
            <Skeleton className="w-32 h-10 rounded-xl" />
          )}
        </div>
        <div className="text-neutral-400 -mt-0.5">Total value</div>
      </div>
      <ul className="flex flex-col gap-2 mt-auto w-full pb-4">
        {Object.keys(vaultsByToken).map((tokenSymbol) => (
          <TokenCard
            tokenSymbol={tokenSymbol}
            token={tokenData?.find((tD) => tD.tokenSymbol === tokenSymbol)}
            setScreen={setScreen}
            setToken={setToken}
            key={tokenSymbol + "-card"}
          />
        ))}
      </ul>
    </div>
  );
}

function TokenCard({
  tokenSymbol,
  token,
  setScreen,
  setToken,
}: {
  tokenSymbol: string;
  token?: TokenData;
  setScreen: (screen: Screen) => void;
  setToken: (token: Token) => void;
}) {
  return (
    <li
      className="w-full bg-white rounded-xl border border-neutral-100 flex items-center px-5 py-2 shadow shadow-neutral-100 hover:scale-[1.01] duration-300 cursor-pointer hover:shadow-neutral-200"
      onClick={() => {
        setScreen(Screen.Token);
        setToken(tokenSymbol as Token);
      }}
    >
      <div className="p-px border border-neutral-200 rounded-full">
        <img
          src={`/${tokenSymbol}.${tokenSymbol !== "cbBTC" ? "svg" : "webp"}`}
          className="w-9 h-9 rounded-full"
        />
      </div>
      <div className="ml-4 flex items-center gap-2">
        <div className="font-semibold font-sans">{tokenSymbol}</div>{" "}
        {vaultsByToken[`${tokenSymbol}`]?.length > 0 && (
          <div className="border border-sky-600/30 bg-sky-400/5 px-1.5 rounded-full text-[11px] text-sky-600/80 font-medium">
            Earn
          </div>
        )}
      </div>
      <div className="ml-auto flex flex-col items-end">
        <div className="font-semibold font-sans">
          {token ? (
            `$${(Number(token.amount) * Number(token.price)).toFixed(2)}`
          ) : (
            <Skeleton className="w-10 h-3 ml-1" />
          )}
        </div>
        <div className="text-[13px] text-neutral-400">
          {token ? (
            Number(token.amount).toFixed(3)
          ) : (
            <Skeleton className="w-10 mr-1 bg-neutral-100/90" />
          )}{" "}
          {tokenSymbol}
        </div>
      </div>
    </li>
  );
}
