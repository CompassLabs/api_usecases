/**
 * Convenience hook for accessing wallet functionality
 */

import { useWalletContext } from "@/lib/contexts/wallet-context";

export function useWallet() {
  const {
    ownerAddress,
    embeddedWallet,
    connectedWallet,
    earnAccount,
    isConnected,
    isInitializing,
    login,
    logout,
  } = useWalletContext();

  return {
    // Owner address - the wallet that owns the earn account
    // This is the external wallet if connected, otherwise the embedded wallet
    ownerAddress,

    // Legacy alias for backwards compatibility
    address: ownerAddress,

    // Embedded wallet (created by Privy for social logins)
    embeddedWalletAddress: embeddedWallet.address,

    // Connected external wallet (MetaMask, Coinbase, etc.)
    connectedWalletAddress: connectedWallet.address,

    // Earn account (proxy wallet that holds funds)
    earnAccountAddress: earnAccount.address,
    hasEarnAccount: earnAccount.isCreated,
    isCreatingEarnAccount: earnAccount.isCreating,
    createEarnAccount: earnAccount.createAccount,

    // Auth state
    isConnected,
    isInitializing,

    // Actions
    login,
    logout,
  };
}
