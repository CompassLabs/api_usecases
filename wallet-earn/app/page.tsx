import Screens from "@/components/Screens";
import { cn, generateWalletGradient } from "@/utils/utils";
import { privateKeyToAccount } from "viem/accounts";

export default async function Home() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="relative max-w-[400px] w-full border-[10px] border-neutral-800 bg-neutral-50 h-full max-h-[800px] shadow-xl rounded-[42px] outline-3 outline-neutral-300 overflow-hidden px-2.5">
        <div className="absolute z-10 top-5 left-1/2 -translate-x-1/2 flex items-center text-neutral-600 border border-neutral-200 px-2 py-1 rounded-xl bg-white">
          <div
            className={cn(
              "w-6 h-6 border border-neutral-200 rounded-full mr-1.5 outline -outline-offset-2 outline-neutral-900/15"
            )}
            style={{ background: generateWalletGradient(account.address) }}
          />
          {account.address.slice(0, 6)}
          <span className="text-xs">●●●●</span>
          {account.address.slice(-4)}
        </div>
        <Screens address={account.address} />
      </div>
    </div>
  );
}
