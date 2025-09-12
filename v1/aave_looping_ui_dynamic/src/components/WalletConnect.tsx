'use client';

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";
import { useState } from "react";

export const WalletConnect = () => {
  const { user, handleLogOut, removeWallet, primaryWallet } = useDynamicContext();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      // If user wants to completely log out (recommended for full disconnect)
      await handleLogOut();
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback to removing just the wallet if logout fails
      if (primaryWallet?.id) {
        removeWallet(primaryWallet.id);
      }
    } finally {
      setIsDisconnecting(false);
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
              disabled={isDisconnecting}
              className={`${
                isDisconnecting 
                  ? 'bg-red-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2`}
            >
              {isDisconnecting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect Wallet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 