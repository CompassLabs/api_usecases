'use client';

import { useState, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { isDynamicWaasConnector } from '@dynamic-labs/wallet-connector-core';
import { DynamicWaasEVMConnector } from '@dynamic-labs/waas-evm';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, getAddress, http } from 'viem';
import { base } from 'viem/chains';

export const BundledTransaction = () => {
  const { user, primaryWallet } = useDynamicContext();
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const getChainId = async (): Promise<number> => {
    try {
      const walletClient: any = await (primaryWallet as any)?.getWalletClient?.();
      console.log('walletClient:', walletClient);
      walletClient.switchNetwork(8453);
      console.log('walletClient:', walletClient);
      return walletClient?.chain?.id ?? 1;
    } catch {
      return 1;
    }
  };

  const handleExportPrivateKey = async () => {
    if (!primaryWallet?.address) {
      setError("Please create a wallet first");
      return;
    }
  
    if (!primaryWallet.connector?.isEmbeddedWallet) {
      setError("You do not have an embedded wallet");
      return;
    }

    try {
      setShowExportModal(true);
      
      // Wait for the container to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!iframeContainerRef.current) {
        throw new Error("Export container not available");
      }

      const connector = primaryWallet?.connector as DynamicWaasEVMConnector;
      const privateKey = await connector.exportPrivateKey({
        accountAddress: primaryWallet?.address,
        displayContainer: iframeContainerRef.current as HTMLIFrameElement,
      });
      
      console.log("Private key exported successfully");
    } catch (error) {
      console.error("Error exporting private key:", error);
      setError("Failed to export private key");
      setShowExportModal(false);
    }
  };

  const handleSendBundledTx = async () => {
    setError(null);
    setTxHash(null);
    if (!user || !primaryWallet?.address) {
      setError('Please connect a wallet first.');
      return;
    }

    const sender = primaryWallet.address as `0x${string}`;
    console.log(sender);

    try {
      setIsSending(true);

      const walletClient: any = await (primaryWallet as any).getWalletClient();

      const compass = new CompassApiSDK({
        apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY,
      });

      const auth = await compass.transactionBundler.transactionBundlerAuthorization({
        chain: 'base',
        sender,
      });

      console.log(auth);

      const connector: any = (primaryWallet as any)?.connector;
      console.log("connector", connector.getAddress());
      if (!connector || !isDynamicWaasConnector(connector)) {
        throw new Error('Authorization signing requires an embedded wallet');
      }

      const address = await connector.getAddress();
      console.log("address", address);

      const chainId = await getChainId();
      console.log(chainId);
      const signedAuth = await (connector as any).signAuthorization(auth);

      const account = privateKeyToAccount(process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`);

      const viemWalletClient = createWalletClient({
        account,
        chain: base,
        transport: http(),
      });

      const viemSignedAuth = await viemWalletClient.signAuthorization({
        address: auth.address as `0x${string}`,
        chainId: auth.chainId,
        nonce: auth.nonce
      });

      console.log(signedAuth);
      console.log(viemSignedAuth);

      const unsignedTx = await compass.transactionBundler.transactionBundlerExecute({
        chain: 'base',
        sender,
        signedAuthorization: {
          nonce: signedAuth.nonce,
          address: signedAuth.address,
          chainId: signedAuth.chainId,
          r: signedAuth.r,
          s: signedAuth.s,
          yParity: signedAuth.yParity as number,
        },
        actions: [
          {
            body: {
              actionType: 'SET_ALLOWANCE',
              token: 'USDC',
              contract: 'AaveV3Pool',
              amount: '1000',
            },
          },
        //   {
        //     body: {
        //       actionType: 'AAVE_SUPPLY',
        //       token: 'USDC',
        //       amount: '1',
        //     },
        //   }
        ],
      });


  //   const loopingTx = await compass.transactionBundler.transactionBundlerExecute({
  //     chain: 'base',
  //     sender,
  //     signedAuthorization: {
  //         nonce: signedAuth.nonce,
  //         address: signedAuth.address,
  //         chainId: signedAuth.chainId,
  //         r: signedAuth.r,
  //         s: signedAuth.s,
  //         yParity: signedAuth.yParity as number,
  //     },
  //     actions: [
  //       {
  //         body: {
  //             actionType: 'AAVE_SUPPLY',
  //             token: "USDC",
  //             amount: "1",
  //         },
  //       },
  //     ],
  //   });

  //   console.log('Aave looping transaction:', loopingTx);
    const txRequest = {
      ...unsignedTx.transaction,
      value: BigInt(unsignedTx.transaction.value || '0x0'),
      gas: unsignedTx.transaction.gas ? BigInt(unsignedTx.transaction.gas) : undefined,
      maxFeePerGas: unsignedTx.transaction.maxFeePerGas ? BigInt(unsignedTx.transaction.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: unsignedTx.transaction.maxPriorityFeePerGas ? BigInt(unsignedTx.transaction.maxPriorityFeePerGas) : undefined
    };
    console.log('txRequest', txRequest);

    // NOTE: Using dynamic's wallet client here fails to use a valid authorisation
    // example transaction: https://basescan.org/tx/0x4a129df5b8027066d09a0fc3321e4902b529ce9bb4a0af0781037f78d22e6329
    const hash = await walletClient.sendTransaction(txRequest as any);

    // NOTE: Using viem's wallet client uses the correct authorisation
    // example tx: https://basescan.org/tx/0xa07115eab728aa9e1fef812331c979f7f8a4b3dd9965b1b451bed7d10655cd28
    // using this instead of dynamic's wallet client works
    // const hash2 = await viemWalletClient.sendTransaction(txRequest as any);
      setTxHash(hash);
    } catch (e: any) {
      console.error(e);
    //   setError(e?.message ?? 'Failed to send bundled transaction');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Bundled Transaction
      </h2>

      {!user ? (
        <p className="text-gray-600 dark:text-gray-300">
          Please connect a wallet first to use the bundler.
        </p>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleSendBundledTx}
            disabled={isSending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isSending ? 'Sending…' : 'Send Bundled Transaction'}
          </button>

          {txHash && (
            <div className="text-sm text-gray-700 dark:text-gray-200 break-all">
              <span className="font-medium">Tx Hash:</span> {txHash}
            </div>
          )}

          {/* Export Private Key Button */}
          <button
            onClick={handleExportPrivateKey}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Export Private Key
          </button>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Export Private Key
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Your private key will be displayed securely below. Please store it safely and never share it with anyone.
              </p>
              
              {/* This is the container that Dynamic will use for the secure iframe */}
              <div 
                ref={iframeContainerRef}
                className="w-full min-h-[200px] border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                style={{ 
                  display: 'block',
                  position: 'relative'
                }}
              />
            </div>
            
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

