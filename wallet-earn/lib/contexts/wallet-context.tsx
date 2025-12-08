"use client";

/**
 * Wallet Context for Compass Earn Demo
 *
 * Manages:
 * - Embedded wallet from Privy (for signing)
 * - Earn account state (proxy wallet created via Compass API)
 * - Account creation flow
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import { type Address, type Hex, createPublicClient, http } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useChain } from "./chain-context";
import { getClientRpcUrl } from "@/utils/constants";

// Types
interface WalletContextValue {
  // Owner wallet address - this is the wallet that owns the earn account
  // If user connected with external wallet, this is the external wallet
  // If user logged in with social (email/google), this is the embedded wallet
  ownerAddress: Address | null;

  // Embedded wallet (for signing when using social login)
  embeddedWallet: {
    address: Address | null;
  };

  // Connected external wallet (MetaMask, Coinbase, etc.)
  connectedWallet: {
    address: Address | null;
  };

  // Earn account (Compass proxy wallet)
  earnAccount: {
    address: Address | null;
    isCreated: boolean;
    isCreating: boolean;
    isChecking: boolean;
    createAccount: () => Promise<Address>;
  };

  // Auth state
  isConnected: boolean;
  isInitializing: boolean;

  // Actions
  login: () => void;
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, user, login, logout } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const { chainId, chain } = useChain();

  // Create public client for reading blockchain data (dynamic based on chain)
  // Uses chain-specific RPC URL or falls back to viem's default public RPC
  const publicClient = createPublicClient({
    chain: chain.viemChain,
    transport: http(getClientRpcUrl(chainId)),
  });

  // Embedded wallet state (created by Privy for social logins)
  const [embeddedWalletAddress, setEmbeddedWalletAddress] =
    useState<Address | null>(null);

  // Connected external wallet state (MetaMask, Coinbase, etc.)
  const [connectedWalletAddress, setConnectedWalletAddress] =
    useState<Address | null>(null);

  // Earn account state
  const [earnAccountAddress, setEarnAccountAddress] = useState<Address | null>(
    null
  );
  const [isEarnAccountCreated, setIsEarnAccountCreated] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Loading state
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Extract wallets from Privy user object
   * Priority: External connected wallet > Embedded wallet
   */
  useEffect(() => {
    if (!authenticated || !user) {
      setEmbeddedWalletAddress(null);
      setConnectedWalletAddress(null);
      setEarnAccountAddress(null);
      setIsEarnAccountCreated(false);
      setIsInitializing(false);
      return;
    }

    // Find embedded wallet (created by Privy for social logins)
    const embeddedAccount = user.linkedAccounts?.find(
      (account) =>
        account.type === "wallet" &&
        account.walletClientType === "privy" &&
        account.chainType === "ethereum"
    );

    // Find external connected wallet (MetaMask, Coinbase, etc.)
    // This is any wallet that is NOT the Privy embedded wallet
    const externalWallet = user.linkedAccounts?.find(
      (account) =>
        account.type === "wallet" &&
        account.walletClientType !== "privy" &&
        account.chainType === "ethereum"
    );

    if (
      embeddedAccount &&
      embeddedAccount.type === "wallet" &&
      embeddedAccount.walletClientType === "privy"
    ) {
      setEmbeddedWalletAddress(embeddedAccount.address as Address);
    } else {
      setEmbeddedWalletAddress(null);
    }

    if (
      externalWallet &&
      externalWallet.type === "wallet"
    ) {
      setConnectedWalletAddress(externalWallet.address as Address);
    } else {
      setConnectedWalletAddress(null);
    }

    setIsInitializing(false);
  }, [authenticated, user]);

  // Owner address: prioritize external wallet over embedded wallet
  const ownerAddress = connectedWalletAddress || embeddedWalletAddress;

  /**
   * Check if earn account exists when wallet is connected
   * Uses ownerAddress (external wallet if connected, otherwise embedded wallet)
   */
  const { data: earnAccountData, refetch: refetchEarnAccount, isLoading: isCheckingEarnAccount, isFetching: isFetchingEarnAccount } = useQuery({
    queryKey: ["earn-account", ownerAddress, chainId],
    queryFn: async () => {
      if (!ownerAddress) return null;

      const response = await fetch(
        `/api/earn-account/check?owner=${ownerAddress}&chain=${chainId}`
      );
      if (!response.ok) return null;

      const data = await response.json();
      return data as { earnAccountAddress: string; isDeployed: boolean } | null;
    },
    enabled: !!ownerAddress && authenticated,
    staleTime: 60 * 1000, // 1 minute
    refetchOnMount: true, // Refetch when component mounts
  });

  // Clear earn account state when chain changes (before refetch completes)
  useEffect(() => {
    setEarnAccountAddress(null);
    setIsEarnAccountCreated(false);
  }, [chainId]);

  // Update earn account state from query
  useEffect(() => {
    if (earnAccountData) {
      setEarnAccountAddress(earnAccountData.earnAccountAddress as Address);
      setIsEarnAccountCreated(earnAccountData.isDeployed);
    }
  }, [earnAccountData]);

  /**
   * Create a new Earn account via Compass API
   * Uses ownerAddress as the owner of the earn account
   */
  const createEarnAccount = useCallback(async (): Promise<Address> => {
    if (!ownerAddress) {
      throw new Error("No wallet connected");
    }

    if (isEarnAccountCreated) {
      throw new Error("Earn account already exists");
    }

    setIsCreatingAccount(true);

    try {
      // Step 1: Get unsigned transaction from API
      const response = await fetch("/api/earn-account/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: ownerAddress,
          chain: chainId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create earn account");
      }

      const { transaction, earnAccountAddress: predictedAddress } =
        await response.json();

      // Step 2: Send transaction using Privy
      const txResult = await sendTransaction(
        {
          to: transaction.to as Address,
          data: transaction.data as Hex,
          chainId: chain.viemChain.id,
          value: BigInt(transaction.value || "0"),
        },
        {
          sponsor: true,
          uiOptions: {
            description:
              "Sign this transaction to create your Compass Earn account.",
            buttonText: "Create Account",
          }
        }
      );

      const txHash =
        typeof txResult === "string" ? txResult : txResult.hash;

      // Step 3: Wait for confirmation
      await publicClient.waitForTransactionReceipt({
        hash: txHash as Hex,
        confirmations: 1,
      });

      // Step 4: Update state
      setEarnAccountAddress(predictedAddress as Address);
      setIsEarnAccountCreated(true);

      // Refetch to confirm
      await refetchEarnAccount();

      return predictedAddress as Address;
    } catch (error) {
      console.error("Failed to create earn account:", error);
      throw error;
    } finally {
      setIsCreatingAccount(false);
    }
  }, [
    ownerAddress,
    isEarnAccountCreated,
    sendTransaction,
    refetchEarnAccount,
    chainId,
    chain,
    publicClient,
  ]);

  const handleLogout = useCallback(async () => {
    setEmbeddedWalletAddress(null);
    setConnectedWalletAddress(null);
    setEarnAccountAddress(null);
    setIsEarnAccountCreated(false);
    await logout();
  }, [logout]);

  // Connected if authenticated and has any wallet (external or embedded)
  const isConnected = authenticated && !!ownerAddress;

  const value: WalletContextValue = {
    ownerAddress,
    embeddedWallet: {
      address: embeddedWalletAddress,
    },
    connectedWallet: {
      address: connectedWalletAddress,
    },
    earnAccount: {
      address: earnAccountAddress,
      isCreated: isEarnAccountCreated,
      isCreating: isCreatingAccount,
      isChecking: isCheckingEarnAccount || isFetchingEarnAccount,
      createAccount: createEarnAccount,
    },
    isConnected,
    isInitializing,
    login,
    logout: handleLogout,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

/**
 * Default context value for when provider is not available (SSR, build, or Privy not configured)
 */
const defaultContextValue: WalletContextValue = {
  ownerAddress: null,
  embeddedWallet: {
    address: null,
  },
  connectedWallet: {
    address: null,
  },
  earnAccount: {
    address: null,
    isCreated: false,
    isCreating: false,
    isChecking: false,
    createAccount: async () => {
      throw new Error("Wallet provider not available");
    },
  },
  isConnected: false,
  isInitializing: true, // Show loading state by default
  login: () => {
    console.warn("Wallet provider not available");
  },
  logout: async () => {
    console.warn("Wallet provider not available");
  },
};

/**
 * Hook for accessing wallet context
 */
export function useWalletContext() {
  const context = useContext(WalletContext);

  // Return safe defaults when not within provider (SSR, build, Privy not configured)
  if (!context) {
    return defaultContextValue;
  }

  return context;
}
