"use client";

import React from "react";
import { TokenData, Token } from "./Screens";
import { EnrichedVaultData } from "./TokenScreen";
import { TrendingUp, Copy, Check } from "lucide-react";
import { cn } from "@/utils/utils";
import { Spinner } from "@geist-ui/core";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useWallet } from "@/lib/hooks/use-wallet";
import { useChain } from "@/lib/contexts/chain-context";

export default function EarnItem({
  vaultData,
  token,
  setIsOpen,
  handleRefresh,
  allTokenData,
}: {
  vaultData: EnrichedVaultData;
  token: TokenData;
  setIsOpen: (value: boolean) => void;
  handleRefresh: () => void;
  allTokenData?: TokenData[];
}) {
  const [open, setOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isClosing) {
      setTimeout(() => {
        setIsOpen(false);
        setOpen(false);
        setIsClosing(false);
      }, 300);
    }
  }, [isClosing]);
  return (
    <>
      <li
        className="w-full bg-white rounded-xl border border-neutral-100 flex flex-col px-4 py-3 shadow shadow-neutral-100 hover:scale-[1.01] duration-300 cursor-pointer hover:shadow-neutral-200"
        onClick={() => {
          setOpen(true);
          setIsOpen(true);
        }}
        key={vaultData.address}
      >
        <div className="text-sm font-semibold text-zinc-800 mb-2 px-2 truncate">
          {vaultData.name}
        </div>
        <div className="flex justify-between w-full px-6">
          <div className="flex flex-col">
            <h3 className="self-center text-sm font-medium flex items-center gap-1.5 text-zinc-500">
              APY
            </h3>
            <div className="flex flex-col items-center">
              <div className="relative font-bold flex items-center gap-1 font-sans text-lg">
                <TrendingUp
                  className="absolute -translate-x-full -left-1 text-green-600"
                  size={14}
                />
                {(Number(vaultData.oneMonthReturns) * 100).toFixed(2)}%
              </div>
              <div className="text-[13px] text-neutral-500 -mt-0.5">1 month</div>
            </div>
          </div>
          <div className="flex.">
            <div className="flex flex-col flex-1 items-center">
              <h3 className="text-center font-medium text-sm flex items-center gap-1.5 text-zinc-500">
                Position
              </h3>
              <div className="text-lg font-bold font-sans">
                $
                {(
                  Number(vaultData.userPosition?.amountInUnderlyingToken || 0) *
                  Number(token.price)
                ).toFixed(2)}
              </div>
              <div className="text-[13px] text-neutral-500 -mt-0.5">
                {Number(
                  vaultData.userPosition?.amountInUnderlyingToken || 0
                ).toFixed(3)}{" "}
                {vaultData.denomination}
              </div>
            </div>
          </div>
        </div>
      </li>
      <div
        className={cn(
          "absolute -inset-y-10 -inset-x-10 bg-neutral-400/20 opacity-0 invisible duration-300",
          open &&
            !isClosing &&
            "opacity-100 visible duration-500 backdrop-blur-[2px] ease-[cubic-bezier(0.32,0.72,0,1)]"
        )}
        onClick={() => {
          if (isLoading) return;
          setIsClosing(true);
          setIsOpen(false);
        }}
      />
      <div
        className={cn(
          "absolute z-10 -inset-x-4 bg-white -bottom-4 rounded-t-[42px] border border-neutral-100 translate-y-full duration-300 shadow-xl shadow-neutral-600 px-3",
          open &&
            !isClosing &&
            "translate-y-0 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        )}
      >
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-2 bg-neutral-100 rounded-full" />
        {open && (
          <EarnForm
            vaultData={vaultData}
            token={token}
            handleRefresh={handleRefresh}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
            setIsClosing={setIsClosing}
            allTokenData={allTokenData}
          />
        )}
      </div>
    </>
  );
}

function EarnForm({
  vaultData,
  token,
  handleRefresh,
  setIsLoading,
  isLoading,
  setIsClosing,
  allTokenData,
}: {
  vaultData: EnrichedVaultData;
  token: TokenData;
  handleRefresh: () => void;
  setIsLoading: (v: boolean) => void;
  isLoading: boolean;
  setIsClosing: (v: boolean) => void;
  allTokenData?: TokenData[];
}) {
  const { signTypedData } = usePrivy();
  const { wallets } = useWallets();
  const { ownerAddress } = useWallet();
  const { chainId, chain } = useChain();

  type TabType = 'deposit' | 'withdraw';
  const [activeTab, setActiveTab] = React.useState<TabType>('deposit');
  const [amount, setAmount] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Check if this is an AUSD Morpho vault (uses bundle flow with USDC swap)
  const isAusdMorphoVault = vaultData.isMorphoVault && token.tokenSymbol === Token.AUSD;

  // Get USDC token data for bundle deposits
  const usdcTokenData = allTokenData?.find((t) => t.tokenSymbol === Token.USDC);

  // For AUSD morpho vault deposits, use USDC balance; otherwise use the token balance
  const depositToken = isAusdMorphoVault && activeTab === 'deposit' ? usdcTokenData : token;
  const depositTokenSymbol = isAusdMorphoVault && activeTab === 'deposit' ? Token.USDC : token.tokenSymbol;
  const depositTokenDecimals = depositToken?.decimals || 6;

  // Find the wallet matching the owner address to switch chains if needed
  const activeWallet = wallets.find(w => w.address.toLowerCase() === ownerAddress?.toLowerCase());

  const currentPosition = Number(vaultData.userPosition?.amountInUnderlyingToken || 0);
  const availableBalance = isAusdMorphoVault && activeTab === 'deposit'
    ? Number(usdcTokenData?.amount || 0)
    : Number(token.amount);
  const maxAmount = activeTab === 'deposit' ? availableBalance : currentPosition;

  const numericAmount = Number(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= maxAmount;

  const submitTransaction = async () => {
    if (!isValidAmount || !ownerAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 0: Ensure wallet is on correct network before signing
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

      const formattedAmount = numericAmount.toFixed(depositTokenDecimals);
      const isDeposit = activeTab === 'deposit';

      // For AUSD Morpho vault deposits, use bundle flow (swap USDC to AUSD + deposit)
      const useBundle = isAusdMorphoVault && isDeposit;

      let prepareEndpoint: string;
      let executeEndpoint: string;
      let prepareBody: any;

      if (useBundle) {
        prepareEndpoint = '/api/bundle/prepare';
        executeEndpoint = '/api/bundle/execute';
        prepareBody = {
          vaultAddress: vaultData.address,
          amountIn: formattedAmount,
          tokenIn: Token.USDC,
          tokenOut: Token.AUSD,
          slippage: 0.5,
          owner: ownerAddress,
          chain: chainId,
        };
      } else {
        prepareEndpoint = isDeposit ? '/api/deposit/prepare' : '/api/withdraw/prepare';
        executeEndpoint = isDeposit ? '/api/deposit/execute' : '/api/withdraw/execute';
        prepareBody = {
          vaultAddress: vaultData.address,
          amount: formattedAmount,
          token: token.tokenSymbol,
          owner: ownerAddress,
          chain: chainId,
          ...(activeTab === 'withdraw' && { isAll: numericAmount === currentPosition }),
        };
      }

      // Step 1: Get EIP-712 typed data from backend
      // owner is the wallet that owns the earn account (external wallet or embedded wallet)
      const prepareResponse = await fetch(prepareEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepareBody),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.error || "Failed to prepare transaction");
      }

      const { eip712, normalizedTypes, domain, message } = await prepareResponse.json();

      // Step 2: Sign with the owner wallet
      // If user connected with external wallet, sign with that wallet
      // Otherwise, sign with embedded wallet (for social login users)
      const actionDescription = useBundle
        ? `Swap ${formattedAmount} USDC to AUSD and deposit`
        : `${isDeposit ? "Deposit" : "Withdraw"} ${formattedAmount} ${token.tokenSymbol}`;

      const signatureResult = await signTypedData(
        {
          domain,
          types: normalizedTypes,
          primaryType: "SafeTx",
          message,
        },
        {
          // Specify which wallet address to use for signing
          // This ensures external wallets (MetaMask, etc.) are used when connected
          address: ownerAddress as `0x${string}`,
          uiOptions: {
            title: useBundle ? "Sign Swap & Deposit" : (isDeposit ? "Sign Deposit" : "Sign Withdrawal"),
            description: actionDescription,
            buttonText: "Sign",
          },
        }
      );

      const signature = typeof signatureResult === "string"
        ? signatureResult
        : signatureResult.signature;

      // Step 3: Execute with sponsor
      const executeResponse = await fetch(executeEndpoint, {
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
        throw new Error(errorData.error || "Failed to execute transaction");
      }

      // Success!
      setIsClosing(true);
      handleRefresh();
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickAmount = (percentage: number) => {
    const value = maxAmount * percentage;
    setAmount(value.toFixed(depositTokenDecimals));
  };

  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(vaultData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col justify-center items-center gap-8 h-full pt-12 pb-8">
      <div className="flex flex-col w-full items-center gap-2">
        <h3 className="text-base font-semibold text-zinc-800">
          {vaultData.name}
        </h3>
        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors group"
        >
          <code className="text-xs text-neutral-600 font-mono">
            {vaultData.address.slice(0, 6)}...{vaultData.address.slice(-4)}
          </code>
          {copied ? (
            <Check size={14} className="text-green-600" />
          ) : (
            <Copy size={14} className="text-neutral-400 group-hover:text-neutral-600" />
          )}
        </button>
      </div>

      <div className="flex flex-col w-full">
        <h3 className="self-center mb-2 text-sm font-medium flex items-center gap-1.5 text-zinc-700">
          Performance Metrics
        </h3>
        <ul className="flex justify-around w-full">
          <li className="flex flex-col items-center">
            <div className="relative font-bold text-lg flex items-center gap-1 font-sans">
              <TrendingUp
                className="absolute -translate-x-full -left-1 text-green-600"
                size={14}
              />
              {(Number(vaultData.cagr) * 100).toFixed(2)}%
            </div>
            <div className="text-neutral-500 text-[13px] -mt-0.5">CAGR</div>
          </li>
          <li className="flex flex-col items-center">
            <div className="relative font-bold text-lg flex items-center gap-1 font-sans">
              {(Number(vaultData.lifetimeReturn) * 100).toFixed(2)}%
            </div>
            <div className="text-neutral-500 text-[13px] -mt-0.5">
              Lifetime
            </div>
          </li>
        </ul>
      </div>

      <div className="flex flex-col w-full">
        <h3 className="self-center mb-2 text-sm font-medium flex items-center gap-1.5 text-zinc-700">
          Current Position
        </h3>
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold font-mono tracking-tighter">
            ${(currentPosition * Number(token.price)).toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <img
              className="w-4 h-4"
              src={`${token.tokenSymbol}.${token.tokenSymbol === "cbBTC" ? "webp" : token.tokenSymbol === "AUSD" ? "png" : "svg"}`}
            />
            <div className="text-neutral-500 text-sm">
              {currentPosition.toFixed(4)} {token.tokenSymbol}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full gap-4 px-2">
        <div className="flex w-full border border-neutral-200 rounded-lg p-1 bg-neutral-50">
          <button
            onClick={() => {
              setActiveTab('deposit');
              setAmount('');
            }}
            disabled={isLoading}
            className={cn(
              "flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200",
              activeTab === 'deposit'
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Deposit
          </button>
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setAmount('');
            }}
            disabled={isLoading}
            className={cn(
              "flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200",
              activeTab === 'withdraw'
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Withdraw
          </button>
        </div>

        <div className="flex flex-col gap-3 px-1">
          {isAusdMorphoVault && activeTab === 'deposit' && (
            <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              Deposits use USDC which is automatically swapped to AUSD
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">
              {activeTab === 'deposit' ? 'Available' : 'Deposited'}
            </span>
            <span className="font-medium text-neutral-700">
              {maxAmount.toFixed(4)} {depositTokenSymbol}
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
              className="w-full px-4 py-3 text-2xl font-bold font-mono border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              step="any"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <img
                className="w-5 h-5"
                src={`${depositTokenSymbol}.${depositTokenSymbol === "cbBTC" ? "webp" : depositTokenSymbol === "AUSD" ? "png" : "svg"}`}
              />
              <span className="text-sm font-medium text-neutral-600">
                {depositTokenSymbol}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setQuickAmount(0.25)}
              disabled={isLoading || maxAmount === 0}
              className="flex-1 py-2 px-3 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              25%
            </button>
            <button
              onClick={() => setQuickAmount(0.5)}
              disabled={isLoading || maxAmount === 0}
              className="flex-1 py-2 px-3 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              50%
            </button>
            <button
              onClick={() => setQuickAmount(1)}
              disabled={isLoading || maxAmount === 0}
              className="flex-1 py-2 px-3 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Max
            </button>
          </div>

          {numericAmount > maxAmount && (
            <div className="text-xs text-red-600 px-1">
              Insufficient {activeTab === 'deposit' ? 'balance' : 'deposited amount'}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600 px-1">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-2">
        <button
          className={cn(
            "flex flex-row items-center justify-center bg-neutral-900/90 shadow-[0_0_0_1px_black,inset_0_0_1px_1px_hsla(0,0%,100%,0.14)] text-white font-semibold w-full rounded-xl py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed duration-200 bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800",
            isLoading && "cursor-wait"
          )}
          disabled={!isValidAmount || isLoading}
          onClick={() => !isLoading && submitTransaction()}
        >
          {!isLoading ? (
            isAusdMorphoVault && activeTab === 'deposit' ? 'Swap & Deposit' : (activeTab === 'deposit' ? 'Deposit' : 'Withdraw')
          ) : (
            <>
              <span className="mr-2.5">
                <Spinner className="[&_*_span]:!bg-white" scale={0.8} />
              </span>
              {isAusdMorphoVault && activeTab === 'deposit' ? 'Swapping & Depositing...' : (activeTab === 'deposit' ? 'Depositing...' : 'Withdrawing...')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
