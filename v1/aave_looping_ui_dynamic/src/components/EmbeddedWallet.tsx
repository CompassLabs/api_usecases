'use client';

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState } from "react";
import { useDynamicWaas } from "@dynamic-labs/sdk-react-core";
import { ChainEnum } from "@dynamic-labs/sdk-api-core";

export const EmbeddedWallet = () => {
  const { user, primaryWallet } = useDynamicContext();
  const [isCreating, setIsCreating] = useState(false);
  const dynamicWaas = useDynamicWaas();
  console.log('user', user)
  console.log(dynamicWaas.getWaasWallets());
  
  const { createWalletAccount, getWaasWallets } = useDynamicWaas();

  const onCreateWalletHandler = async () => {
    try {
      const waasWallets = await getWaasWallets();
      if (waasWallets.length === 0) {
        await createWalletAccount([ChainEnum.Evm]);
      }
    } catch (e) {
      console.error(e);
    }
};

  const createEmbeddedWallet = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      await onCreateWalletHandler();
    } catch (error) {
      console.error("Error creating embedded wallet:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Embedded Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Please connect a wallet first to access embedded wallet features
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Embedded Wallet
      </h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Note:</strong> Dynamic automatically creates embedded wallets for users. 
            You can also create additional embedded wallets or manage existing ones.
          </p>
        </div>
        
        {primaryWallet && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Wallet
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {primaryWallet.address}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet Type
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded capitalize">
                {primaryWallet.connector?.name || 'Unknown'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet ID
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {primaryWallet.id || 'No ID'}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={createEmbeddedWallet}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isCreating ? "Creating..." : "Create New Embedded Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}; 