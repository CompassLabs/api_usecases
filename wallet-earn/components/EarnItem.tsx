import React from "react";
import { TokenData, VaultData } from "./Screens";
import { TrendingUp, User } from "lucide-react";
import { cn } from "@/utils/utils";
import { Slider } from "./primitives/Slider";
import { Spinner } from "@geist-ui/core";

export default function EarnItem({
  vaultData,
  token,
  setIsOpen,
  handleRefresh,
}: {
  vaultData: VaultData;
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
        key={vaultData.symbol}
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
                {Number(vaultData.apy.apy7Day).toFixed(2)}%
              </div>
              <div className="text-neutral-500 text-[13px] -mt-0.5">7 day</div>
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
                  Number(vaultData.userPosition?.amountInUnderlyingToken) *
                  Number(token.price)
                ).toFixed(2)}
              </div>
              <div className="text-[13px] text-neutral-500 -mt-0.5">
                {Number(
                  vaultData.userPosition?.amountInUnderlyingToken
                ).toFixed(3)}{" "}
                {vaultData.underlyingToken.symbol}
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
  vaultData: VaultData;
  token: TokenData;
  handleRefresh: () => void;
  setIsLoading: (v: boolean) => void;
  isLoading: boolean;
  setIsClosing: (v: boolean) => void;
}) {
  const [amount, setAmount] = React.useState(
    Number(vaultData.userPosition?.amountInUnderlyingToken)
  );

  const submitEarnTransaction = async () => {
    setIsLoading(true);
    try {
      let response: Response;
      if (amount > Number(vaultData.userPosition?.amountInUnderlyingToken)) {
        const depositAmount = (
          amount - Number(vaultData.userPosition?.amountInUnderlyingToken)
        ).toFixed(token.decimals);
        response = await fetch("/api/deposit", {
          method: "POST",
          body: JSON.stringify({
            vaultAddress: vaultData.vaultAddress,
            amount: depositAmount,
            token: token.tokenSymbol,
          }),
        });
      } else {
        const withdrawAmount = (
          Number(vaultData.userPosition?.amountInUnderlyingToken) - amount
        ).toFixed(token.decimals);
        console.log("amount", amount);
        response = await fetch("/api/withdraw", {
          method: "POST",
          body: JSON.stringify({
            vaultAddress: vaultData.vaultAddress,
            amount: withdrawAmount,
            isAll: amount === 0 ? true : false,
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

  return (
    <div className="flex flex-col justify-center items-center gap-12 h-full pt-12 pb-8">
      <div className="flex flex-col w-full">
        <h3 className="self-center mb-2 text-sm font-medium flex items-center gap-1.5 text-zinc-700">
          Historical Earnings
        </h3>
        <ul className="flex justify-around w-full">
          {Object.entries(vaultData.apy).map(
            ([key, value]) =>
              key !== "current" && (
                <li className="flex flex-col items-center" key={key}>
                  <div className="relative font-bold text-lg flex items-center gap-1 font-sans">
                    <TrendingUp
                      className="absolute -translate-x-full -left-1 text-green-600"
                      size={14}
                    />
                    {Number(value).toFixed(2)}%
                  </div>
                  <div className="text-neutral-500 text-[13px] -mt-0.5">
                    {key.replace("apy", "").replace("Day", " day")}
                  </div>
                </li>
              )
          )}
        </ul>
      </div>
      <div className="flex flex-col w-full">
        <h3 className="self-center mb-2 text-sm font-medium flex items-center gap-1.5 text-zinc-700">
          Staked Position
        </h3>
        <div className="flex w-full justify-around items-center">
          <button
            className="w-16 border border-neutral-300 text-neutral-600 text-[13px] font-medium h-fit rounded-full px-3 cursor-pointer"
            onClick={() => setAmount(0)}
            disabled={isLoading}
          >
            None
          </button>
          <div className="flex flex-col items-center">
            <div className="text-5xl font-bold font-mono tracking-tighter">
              ${(amount * Number(token.price)).toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 mt-px">
              <img
                className="w-5 h-5"
                src={`${token.tokenSymbol}.${
                  token.tokenSymbol !== "cbBTC" ? "svg" : "webp"
                }`}
              />
              <div className="text-neutral-500 font-medium">
                {token.tokenSymbol}
              </div>
            </div>
          </div>
          <button
            className="w-16 border border-neutral-300 text-neutral-600 text-[13px] font-medium h-fit rounded-full px-3 cursor-pointer"
            onClick={() =>
              setAmount(
                Number(token.amount) +
                  Number(vaultData.userPosition?.amountInUnderlyingToken)
              )
            }
            disabled={isLoading}
          >
            All
          </button>
        </div>
      </div>
      <div className="w-full px-8">
        <Slider
          value={[amount]}
          max={
            Number(token.amount) +
            Number(vaultData.userPosition?.amountInUnderlyingToken)
          }
          step={
            (Number(token.amount) +
              Number(vaultData.userPosition?.amountInUnderlyingToken)) /
            400
          }
          onValueChange={(v) => setAmount(v[0])}
          disabled={isLoading}
        />
      </div>
      <div className="w-full">
        <button
          className={cn(
            "flex flex-row items-center justify-center bg-neutral-900/90 shadow-[0_0_0_1px_black,inset_0_0_1px_1px_hsla(0,0%,100%,0.14)] text-white font-semibold tracking-tighter. w-full rounded-xl py-1.5 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed duration-200 bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800",
            isLoading && "cursor-wait"
          )}
          disabled={
            amount === Number(vaultData.userPosition?.amountInUnderlyingToken)
          }
          onClick={() => !isLoading && submitEarnTransaction()}
        >
          {!isLoading ? (
            "Stake"
          ) : (
            <>
              <span className="mr-2.5">
                <Spinner className="[&_*_span]:!bg-white" scale={0.8} />
              </span>
              Staking...
            </>
          )}
        </button>
      </div>
    </div>
  );
}
