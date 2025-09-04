'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { createAppKit, useAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from 'wagmi/chains';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi';

interface WalletInfo {
  address: string;
  chainId: number;
}

interface WalletConnectContextType {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBaseChain: () => Promise<void>;
}

const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '4f4c7e7bb8a2c9b2a6c5d8f3e9a1b5c7';

// 2. Create a metadata object - optional
const metadata = {
  name: 'Compass Labs',
  description: 'Aave Leverage Looping with WalletConnect',
  url: 'https://compass-labs.io', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 3. Set the networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  {
    id: 8453,
    name: 'Base',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorers: {
      default: {
        name: 'Base Scan',
        url: 'https://basescan.org'
      }
    },
    rpcUrls: {
      default: {
        http: ['https://mainnet.base.org']
      }
    },
    chainNamespace: 'eip155'
  }
];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [base],
  projectId,
  ssr: true
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  enableWalletConnect: true,
  enableInjected: false, // Disable injected wallets to prevent auto-connection
  enableEIP6963: true, // Enable EIP-6963 wallet detection
  enableCoinbase: true, // Enable Coinbase wallet
  featuredWalletIds: [], // Don't auto-feature any wallets
  includeWalletIds: [], // Don't auto-include specific wallets
  excludeWalletIds: [], // Don't exclude any wallets
//   enableOnramp: false, // Disable onramp features
});

// Create a client
const queryClient = new QueryClient();

function WalletConnectProviderContent({ children }: { children: ReactNode }) {
  const { address, isConnecting, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { open } = useAppKit();
  const [error, setError] = useState<string | null>(null);
  const [hasTriedAutoConnect, setHasTriedAutoConnect] = useState(false);

  const wallet: WalletInfo | null = address ? {
    address,
    chainId: chainId || 8453
  } : null;

  // Completely prevent any auto-connection attempts
  useEffect(() => {
    if (!hasTriedAutoConnect) {
      setHasTriedAutoConnect(true);
      // Clear any existing connections on app load to prevent auto-popup
      if (address) {
        disconnect();
      }
    }
  }, [hasTriedAutoConnect, address, disconnect]);

  const connectWallet = async () => {
    try {
      setError(null);
      // Open the AppKit modal
      await open();
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setError(null);
    disconnect();
  };

  const switchToBaseChain = async () => {
    try {
      setError(null);
      await switchChain({ chainId: 8453 });
    } catch (err: any) {
      console.error('Failed to switch to Base chain:', err);
      setError(err.message || 'Failed to switch to Base chain');
    }
  };

  const value: WalletConnectContextType = {
    wallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToBaseChain,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <WalletConnectProviderContent>
          {children}
        </WalletConnectProviderContent>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (context === undefined) {
    throw new Error('useWalletConnect must be used within a WalletConnectProvider');
  }
  return context;
}

// Helper function to get the correct provider - for WalletConnect we use wagmi
export const getWalletConnectProvider = async (retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      if (typeof window === 'undefined') {
        throw new Error('WalletConnect not available');
      }

      // For WalletConnect, we use wagmi config which manages providers internally
      return wagmiAdapter.wagmiConfig;
    } catch (error: any) {
      console.log(`Provider attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Failed to get WalletConnect provider after retries');
};
