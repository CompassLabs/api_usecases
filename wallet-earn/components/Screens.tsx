"use client";

import React from "react";
import WalletScreen from "./WalletScreen";
import TokenScreen from "./TokenScreen";
import {
  TokenBalanceResponse,
  TokenPriceResponse,
  VaultGetVaultResponse,
} from "@compass-labs/api-sdk/models/components";
import { AnimatePresence, motion } from "motion/react";
import { Spinner } from "@geist-ui/core";

export enum Screen {
  Wallet,
  Token,
}

export enum Token {
  ETH = "ETH",
  WETH = "WETH",
  USDC = "USDC",
  cbBTC = "cbBTC",
  wstETH = "wstETH",
}

export const vaultsByToken: { [key: string]: string[] } = {
  ETH: [],
  WETH: [
    "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1",
    "0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18",
  ],
  USDC: [
    "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738",
  ],
  cbBTC: [],
  wstETH: [],
};

export type TokenData = TokenBalanceResponse & TokenPriceResponse;
export type VaultData = VaultGetVaultResponse & { vaultAddress: string };

export default function Screens() {
  const [screen, setScreen] = React.useState<Screen>(Screen.Wallet);
  const [token, setToken] = React.useState<Token>(Token.ETH);
  const [tokenData, setTokenData] = React.useState<TokenData[]>();
  const [vaultData, setVaultData] = React.useState<VaultData[]>();
  const [loading, setLoading] = React.useState(true);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  React.useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const tokenDataPromises = Object.keys(Token).map((token) =>
          fetch(`/api/token?token=${token}`).then((res) => res.json())
        );

        const vaultDataPromises = Object.keys(vaultsByToken).flatMap(
          (tokenKey) =>
            vaultsByToken[tokenKey].map((vaultAddress) =>
              fetch(`/api/vault/${vaultAddress}`)
                .then((res) => res.json())
                .then((data) => ({ ...data, vaultAddress }))
            )
        );

        const [tokenResults, vaultResults] = await Promise.all([
          Promise.all(tokenDataPromises),
          Promise.all(vaultDataPromises),
        ]);

        if (isMounted) {
          setTokenData(tokenResults);
          setVaultData(vaultResults);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const renderScreen = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center bg-neutral-50">
          <Spinner scale={2} className="opacity-60" />
        </div>
      );
    }

    switch (screen) {
      case Screen.Wallet:
        return (
          <motion.div
            key={Screen.Wallet}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{
              x: "-100%",
              opacity: 0,
            }}
            transition={{
              type: "tween",
              duration: 0.2,
              stiffness: 300,
              damping: 30,
            }}
            className="h-full -translate-x-1/2. bg-neutral-50"
          >
            <WalletScreen
              setScreen={setScreen}
              setToken={setToken}
              tokenData={tokenData}
              vaultData={vaultData}
            />
          </motion.div>
        );
      case Screen.Token:
        return (
          <motion.div
            key={Screen.Token}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "tween", duration: 0.2, stiffness: 300, damping: 30 }}
            className="h-full bg-neutral-50"
          >
            <TokenScreen
              setScreen={setScreen}
              tokenData={
                tokenData?.find((tB) => tB.tokenSymbol === token) as TokenData
              }
              vaultData={vaultData?.filter(
                (vD) => vD.underlyingToken.symbol === token
              )}
              handleRefresh={handleRefresh}
            />
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {renderScreen()}
    </AnimatePresence>
  );
}
