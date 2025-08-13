'use client';

import { useState } from 'react';
import SimpleWalletConnect from '@/components/SimpleWalletConnect';
import AaveLoopingStrategy from '@/components/AaveLoopingStrategy';

export default function Home() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnectionChange = (isConnected: boolean, address: string | null) => {
    setIsWalletConnected(isConnected);
    setWalletAddress(address);
  };
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Welcome to Aave Looping UI
        </h2>
        <p className="mt-4 text-lg leading-8 text-gray-600">
          A simple Next.js application for managing Aave looping strategies
        </p>
      </div>

      {/* Wallet Connection Section */}
      <div className="max-w-md mx-auto">
        <SimpleWalletConnect onConnectionChange={handleConnectionChange} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">1</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
                <p className="text-sm text-gray-500">
                  Connect your MetaMask wallet above to get started
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">2</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Setup Strategy</h3>
                <p className="text-sm text-gray-500">
                  Configure your looping parameters
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">3</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Execute Loop</h3>
                <p className="text-sm text-gray-500">
                  Execute your Aave looping strategy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aave Looping Strategy - Only show when wallet is connected */}
      {isWalletConnected ? (
        <AaveLoopingStrategy />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600">
              Please connect your MetaMask wallet above to access the Aave looping strategy configuration.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}