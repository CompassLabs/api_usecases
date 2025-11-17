"use client";

import { cn } from "@/utils/utils";
import { Loading } from "@geist-ui/core";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";

export default function ConnectScreen() {
  const { address, isConnected, caipAddress, status, embeddedWalletInfo } =
    useAppKitAccount();

  const { open } = useAppKit();
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    if (status === "disconnected") {
      setIsDisconnected(true);
    }
  }, [status]);

  return (
    <div className="relative h-full flex flex-col items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="border border-neutral-200 rounded-lg shadow shadow-neutral-200 w-12 h-12 flex">
          {!isDisconnected ? (
            <Loading className="" />
          ) : (
            <Wallet
              className="m-auto text-neutral-600"
              strokeWidth={1.6}
              absoluteStrokeWidth
            />
          )}
        </div>
        {Array(10)
          .fill("")
          .map((_, index) => (
            <div
              className={cn(
                "shadow-sm shadow-neutral-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-neutral-200 rounded-full"
              )}
              style={{
                width: `calc(${110 + index * 70}px)`,
                height: `calc(${110 + index * 70}px)`,
                opacity: 0.9 - index * 0.1,
              }}
              key={`ring-${index}`}
            />
          ))}
      </div>
      <div className="absolute top-[53%] flex flex-col items-center">
        <h1 className="font-bold text-xl mt-3">
          {!isDisconnected ? "Connecting wallet" : "Wallet not connected"}
        </h1>
        {isDisconnected && (
          <p className="text-center max-w-xs text-neutral-500">
            Please connect your wallet to get started with this demo.
          </p>
        )}
      </div>
      {!isDisconnected && (
        <div className="absolute bottom-6">
          <button
            onClick={() => open()}
            className="flex flex-row items-center justify-center px-8 mt-3 bg-neutral-900/90 shadow-[0_0_0_1px_black,inset_0_0_1px_1px_hsla(0,0%,100%,0.14)] text-white font-semibold rounded-xl py-2 w-xs cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed duration-200 bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800"
          >
            Connect
          </button>
        </div>
      )}
    </div>
  );
}
