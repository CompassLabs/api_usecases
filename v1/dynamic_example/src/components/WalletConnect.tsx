'use client';

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";

export const WalletConnect = () => {
  const { user, handleUnlinkWallet, primaryWallet } = useDynamicContext();

  const handleDisconnect = () => {
    if (primaryWallet?.id) {
      handleUnlinkWallet(primaryWallet.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Wallet Connection
      </h2>
      
      {!user ? (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your wallet to get started
          </p>
          <DynamicConnectButton>
            Connect Wallet
          </DynamicConnectButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✅ Wallet Connected Successfully!
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                User Email
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {user.email || 'No email'}
              </p>
            </div>
            
            {primaryWallet && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wallet Address
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                  {primaryWallet.address}
                </p>
              </div>
            )}
            
            {primaryWallet?.connector && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wallet Type
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded capitalize">
                  {primaryWallet.connector?.name || 'Unknown'}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDisconnect}
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