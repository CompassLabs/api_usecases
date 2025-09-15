'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MetaMaskWallet {
  address: string;
  chainId: number;
}

interface MetaMaskContextType {
  wallet: MetaMaskWallet | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBaseChain: () => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

const BASE_CHAIN_ID = 8453; // Base mainnet
const BASE_CHAIN_CONFIG = {
  chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<MetaMaskWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    if (typeof window === 'undefined') return false;
    
    // Check for window.ethereum and ensure it's MetaMask
    return (
      typeof window.ethereum !== 'undefined' &&
      (window.ethereum.isMetaMask === true || window.ethereum.providers?.some((p: any) => p.isMetaMask))
    );
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      // Add a small delay to ensure MetaMask is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMetaMaskInstalled()) {
        console.log('MetaMask not detected');
        return;
      }

      try {
        let provider = window.ethereum;
        
        // If multiple providers exist, try to find MetaMask specifically
        if (window.ethereum?.providers?.length ?? 0 > 0) {
          provider = window.ethereum?.providers?.find((p: any) => p.isMetaMask) || window.ethereum as any;
        }

        const accounts = await provider?.request({ method: 'eth_accounts' }) as string[];
        if (accounts?.length > 0) {
          const chainId = await provider?.request({ method: 'eth_chainId' });
          setWallet({
            address: accounts[0],
            chainId: parseInt(chainId as any, 16),
          });
          console.log('Existing MetaMask connection found:', accounts[0]);
        }
      } catch (err) {
        console.error('Error checking existing connection:', err);
      }
    };

    checkConnection();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      setError(null); // Clear any previous errors
      
      if (accounts.length === 0) {
        console.log('MetaMask disconnected or locked');
        setWallet(null);
      } else {
        // Get the current chain ID when accounts change
        try {
          let provider = window.ethereum;
          if (window.ethereum?.providers?.length ?? 0 > 0) {
            provider = window.ethereum?.providers?.find((p: any) => p.isMetaMask) || window.ethereum as any;
          }
          
          const chainId = await provider?.request({ method: 'eth_chainId' });
          setWallet({
            address: accounts[0],
            chainId: parseInt(chainId as any, 16),
          });
          console.log('MetaMask reconnected with account:', accounts[0]);
        } catch (err) {
          console.error('Error getting chain ID after account change:', err);
          // Still set the wallet with a default chain ID
          setWallet({
            address: accounts[0],
            chainId: 8453, // Default to Base
          });
        }
      }
    };

    const handleChainChanged = (chainId: string) => {
      setWallet(prev => prev ? { ...prev, chainId: parseInt(chainId, 16) } : null);
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet?.address]);

  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask extension to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // First try to get the ethereum provider
      let provider = window.ethereum;
      
      // If multiple providers exist, try to find MetaMask specifically
      if (window.ethereum?.providers?.length ?? 0 > 0) {
        provider = window.ethereum?.providers?.find((p: any) => p.isMetaMask) || window.ethereum as any;
      }

      if (!provider) {
        throw new Error('MetaMask provider not found');
      }

      console.log('Attempting to connect to MetaMask...');
      
      // Try to get existing accounts first
      let accounts;
      try {
        accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          // No existing accounts, request permission
          accounts = await provider.request({ method: 'eth_requestAccounts' });
        }
      } catch (accountsError: any) {
        // If eth_accounts fails, try requesting accounts directly
        if (accountsError.message?.includes('No active wallet')) {
          console.log('MetaMask locked, requesting accounts...');
          accounts = await provider.request({ method: 'eth_requestAccounts' });
        } else {
          throw accountsError;
        }
      }

      console.log('Accounts received:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available. Please create or unlock a MetaMask account.');
      }

      const chainId = await provider.request({ method: 'eth_chainId' });
      console.log('Chain ID received:', chainId);
      
      setWallet({
        address: accounts[0],
        chainId: parseInt(chainId as any, 16),
      });

      // Auto-switch to Base if not already on Base
      if (parseInt(chainId, 16) !== BASE_CHAIN_ID) {
        await switchToBaseChain();
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      
      let errorMessage = 'Failed to connect wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Connection request was rejected by user';
      } else if (err.code === -32002) {
        errorMessage = 'MetaMask is already processing a connection request. Please check MetaMask.';
      } else if (err.message?.includes('No active wallet')) {
        errorMessage = 'MetaMask is locked. Please unlock MetaMask and try again.';
      } else if (err.message?.includes('rejected')) {
        errorMessage = 'Connection request was rejected by user';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setError(null);
  };

  const switchToBaseChain = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed');
      return;
    }

    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_CHAIN_CONFIG],
          });
        } catch (addError: any) {
          console.error('Error adding Base chain:', addError);
          setError('Failed to add Base chain to MetaMask');
        }
      } else {
        console.error('Error switching to Base chain:', switchError);
        setError('Failed to switch to Base chain');
      }
    }
  };

  const value: MetaMaskContextType = {
    wallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToBaseChain,
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
}

// Helper function to get the correct provider and retry on failure
export const getMetaMaskProvider = async (retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not available');
      }

      let provider = window.ethereum;
      
      // If multiple providers exist, try to find MetaMask specifically
      if (window.ethereum.providers && window.ethereum.providers.length > 0) {
        const metamaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask);
        if (metamaskProvider) {
          provider = metamaskProvider as any;
        }
      }

      // Test the provider by checking if it's responsive
      await provider.request({ method: 'eth_accounts' });
      
      return provider;
    } catch (error: any) {
      console.log(`Provider attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Failed to get MetaMask provider after retries');
};

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      providers?: Array<{
        request: (args: { method: string; params?: any[] }) => Promise<any>;
        isMetaMask?: boolean;
      }>;
    };
  }
}
