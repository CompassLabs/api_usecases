"use client";

import React from "react";
import { TokenData } from "./Screens";
import { cn } from "@/utils/utils";
import { Spinner } from "@geist-ui/core";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useWallet } from "@/lib/hooks/use-wallet";
import { useChain } from "@/lib/contexts/chain-context";
import { ArrowDownUp, X } from "lucide-react";

const ALL_SWAP_TOKENS = ["USDC", "WETH", "ETH", "cbBTC", "wstETH", "AUSD"] as const;
type SwapToken = (typeof ALL_SWAP_TOKENS)[number];

export default function SwapModal({
  isOpen,
  onClose,
  tokenData,
  handleRefresh,
}: {
  isOpen: boolean;
  onClose: () => void;
  tokenData?: TokenData[];
  handleRefresh: () => void;
}) {
  const { signTypedData } = usePrivy();
  const { wallets } = useWallets();
  const { ownerAddress } = useWallet();
  const { chainId, chain } = useChain();

  // Filter tokens based on chain:
  // - AUSD only available on Ethereum mainnet
  // - cbBTC not available on Arbitrum
  const availableSwapTokens = ALL_SWAP_TOKENS.filter((token) => {
    if (token === "AUSD" && chainId !== "ethereum") return false;
    if (token === "cbBTC" && chainId === "arbitrum") return false;
    return true;
  });

  const [tokenIn, setTokenIn] = React.useState<SwapToken>("USDC");
  const [tokenOut, setTokenOut] = React.useState<SwapToken>("WETH");

  // Reset token selection if unavailable token is selected on current chain
  React.useEffect(() => {
    const isTokenInUnavailable =
      (tokenIn === "AUSD" && chainId !== "ethereum") ||
      (tokenIn === "cbBTC" && chainId === "arbitrum");
    const isTokenOutUnavailable =
      (tokenOut === "AUSD" && chainId !== "ethereum") ||
      (tokenOut === "cbBTC" && chainId === "arbitrum");

    if (isTokenInUnavailable) {
      setTokenIn("USDC");
    }
    if (isTokenOutUnavailable) {
      setTokenOut("WETH");
    }
  }, [chainId, tokenIn, tokenOut]);
  const [amount, setAmount] = React.useState("");
  const [slippage, setSlippage] = React.useState("0.5");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = React.useState(false);
  const [estimatedAmountOut, setEstimatedAmountOut] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showTokenInSelect, setShowTokenInSelect] = React.useState(false);
  const [showTokenOutSelect, setShowTokenOutSelect] = React.useState(false);

  const activeWallet = wallets.find(
    (w) => w.address.toLowerCase() === ownerAddress?.toLowerCase()
  );

  const tokenInData = tokenData?.find((t) => t.tokenSymbol === tokenIn);
  const tokenOutData = tokenData?.find((t) => t.tokenSymbol === tokenOut);
  const availableBalance = Number(tokenInData?.amount || 0);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-token-select]')) {
        setShowTokenInSelect(false);
        setShowTokenOutSelect(false);
      }
    };

    if (showTokenInSelect || showTokenOutSelect) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTokenInSelect, showTokenOutSelect]);

  const numericAmount = Number(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= availableBalance;

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmount("");
    setEstimatedAmountOut(null);
  };

  // Debounced quote fetching when amount, tokenIn, or tokenOut changes
  React.useEffect(() => {
    const numAmount = Number(amount);
    if (!amount || numAmount <= 0 || !ownerAddress) {
      setEstimatedAmountOut(null);
      return;
    }

    setIsQuoteLoading(true);
    setEstimatedAmountOut(null);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/swap/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner: ownerAddress,
            tokenIn,
            tokenOut,
            amountIn: amount,
            slippage: Number(slippage),
            chain: chainId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data)
          if (data.estimatedAmountOut) {
            console.log(data.estimatedAmountOut)
            setEstimatedAmountOut(data.estimatedAmountOut);
          }
        }
      } catch (err) {
        console.error("Quote fetch error:", err);
      } finally {
        setIsQuoteLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [amount, tokenIn, tokenOut, ownerAddress, slippage, chainId]);

  const submitSwap = async () => {
    if (!isValidAmount || !ownerAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      if (activeWallet) {
        const currentChainId = activeWallet.chainId;
        if (currentChainId !== `eip155:${chain.viemChain.id}`) {
          try {
            await activeWallet.switchChain(chain.viemChain.id);
          } catch (switchError) {
            throw new Error(`Please switch to ${chain.name} network to continue`);
          }
        }
      }

      const prepareResponse = await fetch("/api/swap/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: ownerAddress,
          tokenIn,
          tokenOut,
          amountIn: amount,
          slippage: Number(slippage),
          chain: chainId,
        }),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.error || "Failed to prepare swap");
      }

      const { eip712, normalizedTypes, domain, message } =
        await prepareResponse.json();

      const signatureResult = await signTypedData(
        {
          domain,
          types: normalizedTypes,
          primaryType: "SafeTx",
          message,
        },
        {
          address: ownerAddress as `0x${string}`,
          uiOptions: {
            title: "Sign Swap",
            description: `Swap ${amount} ${tokenIn} for ${tokenOut}`,
            buttonText: "Sign",
          },
        }
      );

      const signature =
        typeof signatureResult === "string"
          ? signatureResult
          : signatureResult.signature;

      const executeResponse = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: ownerAddress,
          eip712,
          signature,
          chain: chainId,
        }),
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(errorData.error || "Failed to execute swap");
      }

      handleRefresh();
      onClose();
    } catch (err) {
      console.error("Swap error:", err);
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickAmount = (percentage: number) => {
    const value = availableBalance * percentage;
    setAmount(value.toFixed(tokenInData?.decimals || 6));
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={() => !isLoading && onClose()}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-visible">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h2 className="text-lg font-semibold">Swap Tokens</h2>
            <button
              onClick={() => !isLoading && onClose()}
              className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-neutral-500" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-neutral-500">You pay</span>
                <span className="text-neutral-500">
                  Balance: {availableBalance.toFixed(4)} {tokenIn}
                </span>
              </div>
              <div className="relative flex items-center border border-neutral-200 rounded-xl p-3 bg-neutral-50">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                  className="flex-1 min-w-0 text-2xl font-bold font-mono bg-transparent focus:outline-none disabled:opacity-50"
                  step="any"
                />
                <div className="relative flex-shrink-0 ml-2" data-token-select>
                  <button
                    onClick={() => setShowTokenInSelect(!showTokenInSelect)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition-colors whitespace-nowrap"
                  >
                    <img
                      src={`/${tokenIn}.${tokenIn === "cbBTC" ? "webp" : tokenIn === "AUSD" ? "png" : "svg"}`}
                      className="w-5 h-5 flex-shrink-0"
                    />
                    <span className="font-medium">{tokenIn}</span>
                  </button>
                  {showTokenInSelect && (
                    <TokenSelect
                      tokens={availableSwapTokens}
                      selectedToken={tokenIn}
                      onSelect={(token) => {
                        setTokenIn(token);
                        setShowTokenInSelect(false);
                        setAmount("");
                      }}
                      tokenData={tokenData}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-2 px-1">
                <button
                  onClick={() => setQuickAmount(0.25)}
                  disabled={isLoading || availableBalance === 0}
                  className="flex-1 py-1.5 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  25%
                </button>
                <button
                  onClick={() => setQuickAmount(0.5)}
                  disabled={isLoading || availableBalance === 0}
                  className="flex-1 py-1.5 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  50%
                </button>
                <button
                  onClick={() => setQuickAmount(1)}
                  disabled={isLoading || availableBalance === 0}
                  className="flex-1 py-1.5 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="flex justify-center -my-1">
              <button
                onClick={handleSwapTokens}
                disabled={isLoading}
                className="p-2 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <ArrowDownUp size={18} className="text-neutral-600" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-neutral-500">You receive</span>
                <span className="text-neutral-500">
                  Balance:{" "}
                  {Number(tokenOutData?.amount || 0).toFixed(4)} {tokenOut}
                </span>
              </div>
              <div className="relative flex items-center border border-neutral-200 rounded-xl p-3 bg-neutral-50">
                <div className="flex-1 min-w-0 text-2xl font-bold font-mono text-neutral-400">
                  {isQuoteLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner scale={0.6} />
                    </span>
                  ) : estimatedAmountOut ? (
                    <span className="text-neutral-900">~{estimatedAmountOut}</span>
                  ) : (
                    "~"
                  )}
                </div>
                <div className="relative flex-shrink-0 ml-2" data-token-select>
                  <button
                    onClick={() => setShowTokenOutSelect(!showTokenOutSelect)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition-colors whitespace-nowrap"
                  >
                    <img
                      src={`/${tokenOut}.${tokenOut === "cbBTC" ? "webp" : tokenOut === "AUSD" ? "png" : "svg"}`}
                      className="w-5 h-5 flex-shrink-0"
                    />
                    <span className="font-medium">{tokenOut}</span>
                  </button>
                  {showTokenOutSelect && (
                    <TokenSelect
                      tokens={availableSwapTokens}
                      selectedToken={tokenOut}
                      onSelect={(token) => {
                        setTokenOut(token);
                        setShowTokenOutSelect(false);
                      }}
                      tokenData={tokenData}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50">
              <span className="text-sm text-neutral-600">Slippage tolerance</span>
              <div className="flex items-center gap-2">
                {["0.1", "0.5", "1.0"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    disabled={isLoading}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors",
                      slippage === val
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-neutral-200 hover:bg-neutral-100"
                    )}
                  >
                    {val}%
                  </button>
                ))}
                <div className="flex items-center border border-neutral-200 rounded-lg bg-white">
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    disabled={isLoading}
                    className="w-14 px-2 py-1 text-sm text-right font-medium bg-transparent focus:outline-none"
                    step="0.1"
                    min="0.1"
                    max="5"
                  />
                  <span className="pr-2 text-sm text-neutral-500">%</span>
                </div>
              </div>
            </div>

            {numericAmount > availableBalance && (
              <div className="text-xs text-red-600 px-1">
                Insufficient balance
              </div>
            )}
            {error && <div className="text-xs text-red-600 px-1">{error}</div>}

            <button
              className={cn(
                "flex flex-row items-center justify-center bg-neutral-900/90 shadow-[0_0_0_1px_black,inset_0_0_1px_1px_hsla(0,0%,100%,0.14)] text-white font-semibold w-full rounded-xl py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed duration-200 bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800",
                isLoading && "cursor-wait"
              )}
              disabled={!isValidAmount || isLoading}
              onClick={() => !isLoading && submitSwap()}
            >
              {!isLoading ? (
                "Swap"
              ) : (
                <>
                  <span className="mr-2.5">
                    <Spinner className="[&_*_span]:!bg-white" scale={0.8} />
                  </span>
                  Swapping...
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function TokenSelect({
  tokens,
  selectedToken,
  onSelect,
  tokenData,
}: {
  tokens: readonly SwapToken[];
  selectedToken: SwapToken;
  onSelect: (token: SwapToken) => void;
  tokenData?: TokenData[];
}) {
  return (
    <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-[60] min-w-[140px] max-h-[200px] overflow-y-auto">
      {tokens.map((token) => {
        const data = tokenData?.find((t) => t.tokenSymbol === token);
        return (
          <button
            key={token}
            onClick={() => onSelect(token)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 transition-colors first:rounded-t-lg last:rounded-b-lg",
              token === selectedToken && "bg-neutral-50"
            )}
          >
            <img
              src={`/${token}.${token === "cbBTC" ? "webp" : token === "AUSD" ? "png" : "svg"}`}
              className="w-5 h-5"
            />
            <span className="font-medium">{token}</span>
            {data && (
              <span className="ml-auto text-xs text-neutral-400">
                {Number(data.amount).toFixed(2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
