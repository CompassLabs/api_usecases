'use client';

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState, useEffect } from "react";
import { useDynamicWaas } from "@dynamic-labs/sdk-react-core";
import { ChainEnum } from "@dynamic-labs/sdk-api-core";

interface EmbeddedWalletProps {
  onWalletLoad?: (wallet: any) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const EmbeddedWallet = ({ onWalletLoad, onLoadingChange }: EmbeddedWalletProps) => {
  const { user, primaryWallet } = useDynamicContext();
  const [isCreating, setIsCreating] = useState(false);
  const [embeddedWallet, setEmbeddedWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { createWalletAccount, getWaasWallets } = useDynamicWaas();
  
  const onCreateWalletHandler = async () => {
    try {
      const waasWallets = getWaasWallets();
      if (waasWallets.length === 0) {
        await createWalletAccount([ChainEnum.Evm]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      onLoadingChange?.(false);
      return;
    }

    const loadWallet = async () => {
      setIsLoading(true);
      onLoadingChange?.(true);
      
      try {
        // Wait a bit for Dynamic to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const waasWallets = getWaasWallets();
        console.log('waasWallets', waasWallets);
        
        if (waasWallets.length > 0) {
          setEmbeddedWallet(waasWallets[0]);
          onWalletLoad?.(waasWallets[0]);
        } else {
          // If no wallet exists, try to create one
          await createWalletAccount([ChainEnum.Evm]);
          // Check again after creation
          const newWallets = getWaasWallets();
          if (newWallets.length > 0) {
            setEmbeddedWallet(newWallets[0]);
            onWalletLoad?.(newWallets[0]);
          }
        }
      } catch (error) {
        console.error('Error loading embedded wallet:', error);
      } finally {
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    };

    loadWallet();
  }, [user, onWalletLoad, onLoadingChange]);

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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Embedded Wallet
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-300">
            Loading embedded wallet...
          </p>
        </div>
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
        
        {embeddedWallet && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Wallet
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {embeddedWallet.address}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet Type
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded capitalize">
                {embeddedWallet.connector?.name || 'Unknown'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet ID
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {embeddedWallet.id || 'No ID'}
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