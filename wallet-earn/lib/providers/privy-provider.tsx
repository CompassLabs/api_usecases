"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { base } from "viem/chains";
import { QueryProvider } from "./query-provider";
import { WalletProvider } from "@/lib/contexts/wallet-context";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  // During build or if no app ID is set, render without Privy
  // WalletProvider will use safe defaults since Privy hooks won't work
  if (!PRIVY_APP_ID) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID not set - wallet features disabled");
    return (
      <QueryProvider>
        {children}
      </QueryProvider>
    );
  }

  return (
    <PrivyProviderBase
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#18181b", // neutral-900 to match the app
        },
        loginMethods: ["wallet", "email", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
        defaultChain: base,
        supportedChains: [base],
      }}
    >
      <QueryProvider>
        <WalletProvider>
          {children}
        </WalletProvider>
      </QueryProvider>
    </PrivyProviderBase>
  );
}
