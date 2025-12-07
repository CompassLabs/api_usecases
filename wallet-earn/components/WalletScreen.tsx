"use client";

import React from "react";
import { Screen, Token, TokenData, vaultsByToken } from "./Screens";
import { VaultsListResponse } from "@compass-labs/api-sdk/models/components";
import Skeleton from "./primitives/Skeleton";
import { useWallet } from "@/lib/hooks/use-wallet";
import { useFundWallet } from "@privy-io/react-auth";
import { LogOut, Loader2, ArrowLeftRight, Copy, Check } from "lucide-react";
import { cn } from "@/utils/utils";
import SwapModal from "./SwapModal";
import ChainSwitcher from "./ChainSwitcher";
import { useChain } from "@/lib/contexts/chain-context";

export default function WalletScreen({
  setScreen,
  setToken,
  tokenData,
  vaultsListData,
  handleRefresh,
}: {
  setScreen: (screen: Screen) => void;
  setToken: (token: Token) => void;
  tokenData?: TokenData[];
  vaultsListData?: VaultsListResponse;
  handleRefresh: () => void;
}) {
  const {
    isConnected,
    isInitializing,
    login,
    logout,
    hasEarnAccount,
    isCreatingEarnAccount,
    createEarnAccount,
    earnAccountAddress,
  } = useWallet();

  const { fundWallet } = useFundWallet();
  const { chain } = useChain();
  const [isSwapOpen, setIsSwapOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopyAddress = async () => {
    if (!earnAccountAddress) return;
    await navigator.clipboard.writeText(earnAccountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleFundAccount = async () => {
    if (!earnAccountAddress) return;

    await fundWallet({
      address: earnAccountAddress,
      options: {
        chain: chain.viemChain,
        asset: "USDC",
        amount: "10",
      },
    });
  };

  // Calculate total from wallet balances only
  const totalBalance =
    tokenData?.reduce((sum, token) => {
      return sum + Number(token.amount) * Number(token.price);
    }, 0) || 0;

  // Not connected state - show login button
  if (!isConnected && !isInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to Compass Earn</h2>
          <p className="text-neutral-500 text-sm">
            Connect your wallet to start earning yield on your crypto assets
          </p>
        </div>
        <button
          onClick={login}
          className="w-full bg-neutral-900 text-white font-semibold py-3 px-6 rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // Connected but no earn account - show create account button
  if (!hasEarnAccount) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Create Earn Account</h2>
          <p className="text-neutral-500 text-sm">
            Create your Compass Earn account to start depositing and earning
            yield
          </p>
        </div>
        <button
          onClick={createEarnAccount}
          disabled={isCreatingEarnAccount}
          className={cn(
            "w-full bg-neutral-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2",
            isCreatingEarnAccount
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-neutral-800"
          )}
        >
          {isCreatingEarnAccount ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Earn Account"
          )}
        </button>
        <button
          onClick={logout}
          className="text-neutral-500 text-sm hover:text-neutral-700 flex items-center gap-1"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    );
  }

  // Connected with earn account - show main wallet view
  return (
    <div className="flex flex-col h-full">
      {/* Header with chain switcher, swap and logout */}
      <div className="flex items-center px-2 py-2 gap-2">
        {/* Chain Switcher */}
        <ChainSwitcher />
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setIsSwapOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Swap
          </button>
          <button
            onClick={handleFundAccount}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Deposit
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      <SwapModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        tokenData={tokenData}
        handleRefresh={handleRefresh}
      />

      {/* Balance display */}
      <div className="flex flex-col justify-center items-center flex-1">
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
        {/* Earn Account Address */}
        {earnAccountAddress && (
          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-1.5 px-2.5 py-1.5 mt-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
            title={earnAccountAddress}
          >
            <span className="text-xs font-mono text-neutral-500">
              {truncateAddress(earnAccountAddress)}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 text-neutral-400" />
            )}
          </button>
        )}
      </div>

      {/* Token list */}
      <ul className="flex flex-col gap-2 mt-auto w-full pb-4">
        {Object.keys(Token).map((tokenSymbol) => (
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
            Number(token.amount).toFixed(4)
          ) : (
            <Skeleton className="w-10 mr-1 bg-neutral-100/90" />
          )}{" "}
          {tokenSymbol}
        </div>
      </div>
    </li>
  );
}
