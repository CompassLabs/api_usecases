"use client";

import React from "react";
import WalletScreen from "./WalletScreen";
import TokenScreen from "./TokenScreen";
import {
  TokenBalanceResponse,
  TokenPriceResponse,
  VaultsListResponse,
  EarnPositionsResponse,
} from "@compass-labs/api-sdk/models/components";
import { AnimatePresence, motion } from "motion/react";
import { useWallet } from "@/lib/hooks/use-wallet";

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

export type TokenData = TokenBalanceResponse & TokenPriceResponse;

// Dynamic vaults indexed by token denomination
export let vaultsByToken: { [key: string]: string[] } = {};

export default function Screens() {
  const { earnAccountAddress, hasEarnAccount } = useWallet();

  const [screen, setScreen] = React.useState<Screen>(Screen.Wallet);
  const [token, setToken] = React.useState<Token>(Token.ETH);
  const [tokenData, setTokenData] = React.useState<TokenData[]>();
  const [vaultsListData, setVaultsListData] = React.useState<VaultsListResponse>();
  const [positionsData, setPositionsData] = React.useState<EarnPositionsResponse>();

  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getTokenData = async (walletAddress: string) => {
    setTokenData(undefined);
    const tokenDataPromises = Object.keys(Token).map((token) =>
      fetch(`/api/token/${token}?wallet=${walletAddress}`).then((res) => res.json())
    );
    const tokenData: TokenData[] = await Promise.all(tokenDataPromises);
    setTokenData(tokenData);
  };

  const getVaultsListData = async () => {
    setVaultsListData(undefined);
    const response = await fetch(`/api/vaults`);
    const vaultsData: VaultsListResponse = await response.json();

    // Filter to only show USDC vaults
    const filteredVaults = vaultsData.vaults.filter(
      (vault) => vault.denomination.toUpperCase() === "USDC"
    );

    // Build vaultsByToken index from filtered vault list
    const vaultsByTokenMap: { [key: string]: string[] } = {};
    filteredVaults.forEach((vault) => {
      const tokenSymbol = vault.denomination.toUpperCase();
      if (!vaultsByTokenMap[tokenSymbol]) {
        vaultsByTokenMap[tokenSymbol] = [];
      }
      vaultsByTokenMap[tokenSymbol].push(vault.address);
    });

    vaultsByToken = vaultsByTokenMap;

    // Update the response with filtered vaults
    setVaultsListData({
      ...vaultsData,
      vaults: filteredVaults,
      total: filteredVaults.length,
    });
  };

  const getPositionsData = async (walletAddress: string) => {
    setPositionsData(undefined);
    const response = await fetch(`/api/positions?wallet=${walletAddress}`);
    const positions: EarnPositionsResponse = await response.json();
    setPositionsData(positions);
  };

  // Fetch data when earn account is available
  React.useEffect(() => {
    if (hasEarnAccount && earnAccountAddress) {
      getTokenData(earnAccountAddress);
      getVaultsListData();
      getPositionsData(earnAccountAddress);
    } else {
      // Clear data when not connected
      setTokenData(undefined);
      setPositionsData(undefined);
    }
  }, [hasEarnAccount, earnAccountAddress, refreshTrigger]);

  const renderScreen = () => {
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
              vaultsListData={vaultsListData}
              handleRefresh={handleRefresh}
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
              vaultsListData={vaultsListData}
              positionsData={positionsData}
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
