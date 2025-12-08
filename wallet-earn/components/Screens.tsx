"use client";

import React from "react";
import WalletScreen from "./WalletScreen";
import TokenScreen from "./TokenScreen";
import {
  TokenBalanceResponse,
  TokenPriceResponse,
  VaultsListResponse,
  EarnPositionsResponse,
  MorphoGetVaultsResponse,
} from "@compass-labs/api-sdk/models/components";
import { AnimatePresence, motion } from "motion/react";
import { useWallet } from "@/lib/hooks/use-wallet";
import { useChain } from "@/lib/contexts/chain-context";

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
  AUSD = "AUSD",
}

export type TokenData = TokenBalanceResponse & TokenPriceResponse;

// Dynamic vaults indexed by token denomination
export let vaultsByToken: { [key: string]: string[] } = {};

export default function Screens() {
  const { earnAccountAddress, hasEarnAccount } = useWallet();
  const { chainId } = useChain();

  const [screen, setScreen] = React.useState<Screen>(Screen.Wallet);
  const [token, setToken] = React.useState<Token>(Token.ETH);
  const [tokenData, setTokenData] = React.useState<TokenData[]>();
  const [vaultsListData, setVaultsListData] = React.useState<VaultsListResponse>();
  const [positionsData, setPositionsData] = React.useState<EarnPositionsResponse>();

  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [ausdMorphoVaults, setAusdMorphoVaults] = React.useState<MorphoGetVaultsResponse>();

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getTokenData = async (walletAddress: string, chain: string) => {
    setTokenData(undefined);
    // Filter tokens based on chain:
    // - AUSD only available on Ethereum mainnet
    // - cbBTC not available on Arbitrum
    const tokensToFetch = Object.keys(Token).filter((token) => {
      if (token === "AUSD" && chain !== "ethereum") return false;
      if (token === "cbBTC" && chain === "arbitrum") return false;
      return true;
    });
    const tokenDataPromises = tokensToFetch.map((token) =>
      fetch(`/api/token/${token}?wallet=${walletAddress}&chain=${chain}`).then((res) => res.json())
    );
    const tokenData: TokenData[] = await Promise.all(tokenDataPromises);
    setTokenData(tokenData);
  };

  const getVaultsListData = async (chain: string) => {
    setVaultsListData(undefined);
    const response = await fetch(`/api/vaults?chain=${chain}`);
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

  const getPositionsData = async (walletAddress: string, chain: string) => {
    setPositionsData(undefined);
    const response = await fetch(`/api/positions?wallet=${walletAddress}&chain=${chain}`);
    const positions: EarnPositionsResponse = await response.json();
    setPositionsData(positions);
  };

  const getAusdMorphoVaults = async (chain: string) => {
    setAusdMorphoVaults(undefined);
    try {
      const response = await fetch(`/api/morpho-vaults?chain=${chain}&deposit_token=AUSD`);
      const morphoVaults: MorphoGetVaultsResponse = await response.json();
      setAusdMorphoVaults(morphoVaults);

      // If AUSD morpho vaults exist, add AUSD to vaultsByToken
      if (morphoVaults.vaults && morphoVaults.vaults.length > 0) {
        vaultsByToken["AUSD"] = morphoVaults.vaults.map((vault: { address: string }) => vault.address);
      }
    } catch (error) {
      console.error("Error fetching AUSD morpho vaults:", error);
    }
  };

  // Fetch data when earn account is available or chain changes
  React.useEffect(() => {
    if (hasEarnAccount && earnAccountAddress) {
      getTokenData(earnAccountAddress, chainId);
      getVaultsListData(chainId);
      getPositionsData(earnAccountAddress, chainId);
      // Only fetch AUSD Morpho vaults on Ethereum mainnet
      if (chainId === "ethereum") {
        getAusdMorphoVaults(chainId);
      } else {
        setAusdMorphoVaults(undefined);
      }
    } else {
      // Clear data when not connected
      setTokenData(undefined);
      setPositionsData(undefined);
      setAusdMorphoVaults(undefined);
    }
  }, [hasEarnAccount, earnAccountAddress, refreshTrigger, chainId]);

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
              ausdMorphoVaults={ausdMorphoVaults}
              allTokenData={tokenData}
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
