'use client';

import { useMetaMask } from "@/contexts/MetaMaskContext";

export const WalletConnect = () => {
  const { wallet, isConnecting, error, connectWallet, disconnectWallet, switchToBaseChain } = useMetaMask();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        MetaMask Connection
      </h2>
      
      {!wallet ? (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your MetaMask wallet to get started
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className={`${
              isConnecting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto`}
          >
            {isConnecting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✅ MetaMask Connected Successfully!
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet Address
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {wallet.address}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Network
              </label>
              <div className="flex items-center gap-2">
                <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded flex-1">
                  {wallet.chainId === 8453 ? 'Base Mainnet' : `Chain ID: ${wallet.chainId}`}
                </p>
                {wallet.chainId !== 8453 && (
                  <button
                    onClick={switchToBaseChain}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-3 py-2 rounded transition-colors"
                  >
                    Switch to Base
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet Type
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                MetaMask
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={disconnectWallet}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 