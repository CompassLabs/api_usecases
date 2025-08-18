'use client';

import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { isDynamicWaasConnector } from '@dynamic-labs/wallet-connector-core';

export const BundledTransaction = () => {
  const { user, primaryWallet } = useDynamicContext();
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getChainId = async (): Promise<number> => {
    try {
      const walletClient: any = await (primaryWallet as any)?.getWalletClient?.();
      return walletClient?.chain?.id ?? 1;
    } catch {
      return 1;
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

      const chainId = await getChainId();
      console.log(chainId);
      const signedAuth = await (connector as any).signAuthorization({
        address: auth.address as `0x${string}`,
        chainId,
        nonce: auth.nonce,
      });
      console.log(signedAuth);
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
          {
            body: {
              actionType: 'AAVE_SUPPLY',
              token: 'USDC',
              amount: '1',
            },
          }
        ],
      });
      console.log(unsignedTx);
      const hash = await walletClient.sendTransaction(unsignedTx.transaction as any);
      setTxHash(hash);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to send bundled transaction');
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

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

