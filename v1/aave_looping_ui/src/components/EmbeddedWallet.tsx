'use client';

import { useWalletConnect } from "@/contexts/WalletConnectContext";

export const WalletInfo = () => {
  const { wallet } = useWalletConnect();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Wallet Info
      </h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>About WalletConnect:</strong> WalletConnect allows you to connect your preferred wallet to decentralized applications securely. Your private keys never leave your wallet app.
          </p>
        </div>
        
        {wallet ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Connected Address
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {wallet.address}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Network
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {wallet.chainId === 8453 ? 'Base Mainnet (8453)' : `Chain ID: ${wallet.chainId}`}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-gray-900 dark:text-white text-sm">
                  Connected and ready for transactions
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Connect your wallet above to see wallet information
            </p>
          </div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Security Features
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Private keys never leave your device</li>
            <li>• Hardware wallet support</li>
            <li>• Transaction approval required</li>
            <li>• Phishing protection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 