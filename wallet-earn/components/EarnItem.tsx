import React from "react";
import { TokenData } from "./Screens";
import { EnrichedVaultData } from "./TokenScreen";
import { TrendingUp, Copy, Check } from "lucide-react";
import { cn } from "@/utils/utils";
import { Spinner } from "@geist-ui/core";

export default function EarnItem({
  vaultData,
  token,
  setIsOpen,
  handleRefresh,
}: {
  vaultData: EnrichedVaultData;
  token: TokenData;
  setIsOpen: (value: boolean) => void;
  handleRefresh: () => void;
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
        className="w-full bg-white rounded-xl border border-neutral-100 flex items-center px-4 py-2 shadow shadow-neutral-100 hover:scale-[1.01] duration-300 cursor-pointer hover:shadow-neutral-200"
        onClick={() => {
          setOpen(true);
          setIsOpen(true);
        }}
        key={vaultData.address}
      >
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
}: {
  vaultData: EnrichedVaultData;
  token: TokenData;
  handleRefresh: () => void;
  setIsLoading: (v: boolean) => void;
  isLoading: boolean;
  setIsClosing: (v: boolean) => void;
}) {
  type TabType = 'deposit' | 'withdraw';
  const [activeTab, setActiveTab] = React.useState<TabType>('deposit');
  const [amount, setAmount] = React.useState('');

  const currentPosition = Number(vaultData.userPosition?.amountInUnderlyingToken || 0);
  const availableBalance = Number(token.amount);
  const maxAmount = activeTab === 'deposit' ? availableBalance : currentPosition;

  const numericAmount = Number(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= maxAmount;

  const submitTransaction = async () => {
    if (!isValidAmount) return;

    setIsLoading(true);
    try {
      const formattedAmount = numericAmount.toFixed(token.decimals);
      let response: Response;

      if (activeTab === 'deposit') {
        response = await fetch("/api/deposit", {
          method: "POST",
          body: JSON.stringify({
            vaultAddress: vaultData.address,
            amount: formattedAmount,
            token: token.tokenSymbol,
          }),
        });
      } else {
        response = await fetch("/api/withdraw", {
          method: "POST",
          body: JSON.stringify({
            vaultAddress: vaultData.address,
            amount: formattedAmount,
            isAll: numericAmount === currentPosition,
            token: token.tokenSymbol,
          }),
        });
      }

      if (response.status === 200) {
        setIsClosing(true);
        setIsLoading(false);
        handleRefresh();
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickAmount = (percentage: number) => {
    const value = maxAmount * percentage;
    setAmount(value.toFixed(token.decimals));
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
              src={`${token.tokenSymbol}.${
                token.tokenSymbol !== "cbBTC" ? "svg" : "webp"
              }`}
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
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">
              {activeTab === 'deposit' ? 'Available' : 'Deposited'}
            </span>
            <span className="font-medium text-neutral-700">
              {maxAmount.toFixed(4)} {token.tokenSymbol}
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
                src={`${token.tokenSymbol}.${
                  token.tokenSymbol !== "cbBTC" ? "svg" : "webp"
                }`}
              />
              <span className="text-sm font-medium text-neutral-600">
                {token.tokenSymbol}
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
            activeTab === 'deposit' ? 'Deposit' : 'Withdraw'
          ) : (
            <>
              <span className="mr-2.5">
                <Spinner className="[&_*_span]:!bg-white" scale={0.8} />
              </span>
              {activeTab === 'deposit' ? 'Depositing...' : 'Withdrawing...'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
