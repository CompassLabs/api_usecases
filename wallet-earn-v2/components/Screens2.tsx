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
import ConnectScreen from "./ConnectScreen";
import { useAppKitAccount } from "@reown/appkit/react";

export enum Screen {
  Connect,
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
  // cbBTC: ["0x543257eF2161176D7C8cD90BA65C2d4CaEF5a796"],
  cbBTC: [],
  // wstETH: ["0x3E3Cbfd1046C9D1863F83879cc5541B0B789Ec03"],
  wstETH: [],
};

export type TokenData = TokenBalanceResponse & TokenPriceResponse;

export type VaultData = VaultGetVaultResponse & { vaultAddress: string };

export default function Screens2() {
  const { address, isConnected, caipAddress, status, embeddedWalletInfo } =
    useAppKitAccount();

  const [screen, setScreen] = React.useState<Screen>(Screen.Connect);
  const [token, setToken] = React.useState<Token>(Token.ETH);
  const [tokenData, setTokenData] = React.useState<TokenData[]>();
  const [vaultData, setVaultData] = React.useState<VaultData[]>();

  React.useEffect(() => {
    if (status === "connected") {
      setTimeout(() => {
        setScreen(Screen.Wallet);
      }, 1000);
    } else {
      setScreen(Screen.Connect);
    }
  }, [status]);

  const renderScreen = () => {
    switch (screen) {
      case Screen.Connect:
        return (
          <motion.div
            key={Screen.Connect}
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
            className="h-full bg-neutral-50"
          >
            <ConnectScreen />
          </motion.div>
        );
      case Screen.Wallet:
        return (
          <motion.div
            key={Screen.Wallet}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{
              x: "100%",
              opacity: 0.5,
            }}
            transition={{
              type: "tween",
              duration: 0.2,
              stiffness: 300,
              damping: 30,
            }}
            className="h-full bg-neutral-50"
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
            transition={{
              type: "tween",
              duration: 0.2,
              stiffness: 300,
              damping: 30,
            }}
            className="h-full bg-neutral-50"
          >
            <TokenScreen
              setScreen={setScreen}
              tokenSymbol={token}
              tokenData={
                (() =>
                  tokenData?.find(
                    (tB) => tB.tokenSymbol === token
                  ))() as TokenData
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
    <>
      {screen !== Screen.Connect && (
        <motion.div
          className="absolute top-2 left-1/2 -translate-x-1/2"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{
            x: "100%",
            opacity: 0.5,
          }}
          transition={{
            type: "tween",
            duration: 0.2,
            stiffness: 300,
            damping: 30,
          }}
        >
          <appkit-button />
        </motion.div>
      )}
      <AnimatePresence initial={false} mode="popLayout">
        {renderScreen()}
      </AnimatePresence>
    </>
  );
}
