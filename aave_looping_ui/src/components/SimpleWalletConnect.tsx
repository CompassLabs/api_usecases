'use client';

import { useState, useEffect } from 'react';

interface SimpleWalletConnectProps {
  onConnectionChange?: (isConnected: boolean, address: string | null) => void;
}

// Prefer MetaMask if multiple providers are present
function getMetaMaskProvider(): any | null {
  if (typeof window === 'undefined') return null;
  const eth = window.ethereum as any;
  if (!eth) return null;

  // If multiple providers injected (e.g., Trust, Coinbase, MetaMask), pick MetaMask explicitly
  if (Array.isArray(eth.providers) && eth.providers.length) {
    const mm = eth.providers.find((p: any) => p && p.isMetaMask);
    return mm || null;
  }

  // Single provider case: ensure it's MetaMask
  return eth.isMetaMask ? eth : null;
}

export default function SimpleWalletConnect({ onConnectionChange }: SimpleWalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectMetaMask = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const provider = getMetaMaskProvider();
      if (!provider) {
        throw new Error('MetaMask not detected. Please install/enable MetaMask and disable other wallet extensions.');
      }

      // Light wake-up to ensure provider is responsive
      try {
        await provider.request({ method: 'eth_chainId' });
      } catch {
        // ignore
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        onConnectionChange?.(true, accounts[0]);
      } else {
        throw new Error('No accounts found in MetaMask.');
      }
    } catch (err: any) {
      console.log('MetaMask connection error:', err);
      let message = 'Failed to connect to MetaMask.';
      if (err?.code === 4001) message = 'Connection rejected in MetaMask.';
      else if (err?.code === -32002) message = 'Request pending in MetaMask. Open the extension to approve.';
      else if (err?.code === -32603) message = 'No active MetaMask wallet found. Unlock MetaMask and try again.';
      else if (err?.message) message = err.message;
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setError(null);
    onConnectionChange?.(false, null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          MetaMask Connection
        </h3>

        {address ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-700">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <button
              onClick={connectMetaMask}
              disabled={isConnecting}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}