'use client';

import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { isDynamicWaasConnector } from '@dynamic-labs/wallet-connector-core';
import { getAddress } from 'viem';

export const AaveLooping = () => {
  const { user, primaryWallet } = useDynamicContext();
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Aave looping parameters
  const [collateralToken, setCollateralToken] = useState('USDC');
  const [borrowToken, setBorrowToken] = useState('WETH');
  const [initialAmount, setInitialAmount] = useState('100');
  const [leverage, setLeverage] = useState(1.5);
  const [loanToValue, setLoanToValue] = useState(70);
  const [maxSlippage, setMaxSlippage] = useState(2.5);

  const getMaxLeverage = (ltv: number): number => {
    return 1 / (1 - ltv / 100);
  };

  const validateLeverage = (leverageValue: number, ltvValue: number): boolean => {
    const maxLeverage = getMaxLeverage(ltvValue);
    return leverageValue <= maxLeverage;
  };

  const handleAaveLooping = async () => {
    setError(null);
    setTxHash(null);
    
    if (!user || !primaryWallet?.address) {
      setError('Please connect a wallet first.');
      return;
    }

    // Validate inputs
    if (!validateLeverage(leverage, loanToValue)) {
      setError(`Leverage ${leverage}x exceeds maximum ${getMaxLeverage(loanToValue).toFixed(2)}x for ${loanToValue}% LTV`);
      return;
    }

    if (parseFloat(initialAmount) <= 0) {
      setError('Initial amount must be greater than 0');
      return;
    }

    const sender = primaryWallet.address as `0x${string}`;

    try {
      setIsSending(true);

      const walletClient: any = await (primaryWallet as any).getWalletClient();

      const compass = new CompassApiSDK({
        apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY,
      });

      // Get authorization for transaction bundling
      const auth = await compass.transactionBundler.transactionBundlerAuthorization({
        chain: 'base',
        sender,
      });

      const connector: any = (primaryWallet as any)?.connector;
      if (!connector || !isDynamicWaasConnector(connector)) {
        throw new Error('Authorization signing requires an embedded wallet');
      }

      // Sign the authorization
      const signedAuth = await (connector as any).signAuthorization(auth);

      console.log({
        collateralToken: collateralToken as any,
        borrowToken: borrowToken as any,
        initialCollateralAmount: initialAmount,
        multiplier: leverage,
        maxSlippagePercent: maxSlippage,
        loanToValue: loanToValue,
      })

      const loopingTx: any = await compass.transactionBundler.transactionBundlerAaveLoop({
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
        collateralToken: collateralToken as any,
        borrowToken: borrowToken as any,
        initialCollateralAmount: initialAmount,
        multiplier: leverage,
        maxSlippagePercent: maxSlippage,
        loanToValue: loanToValue,
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
        ...loopingTx.transaction,
        chainId: Number(loopingTx.transaction.chainId),
        value: BigInt(loopingTx.transaction.value || '0x0'),
        nonce: loopingTx.transaction.nonce ? BigInt(loopingTx.transaction.nonce) : undefined,
        gas: loopingTx.transaction.gas ? BigInt(loopingTx.transaction.gas) : undefined,
        maxFeePerGas: loopingTx.transaction.maxFeePerGas ? BigInt(loopingTx.transaction.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: loopingTx.transaction.maxPriorityFeePerGas ? BigInt(loopingTx.transaction.maxPriorityFeePerGas) : undefined,
        to: getAddress(loopingTx.transaction.to as `0x${string}`),
        from: getAddress(loopingTx.transaction.from as `0x${string}`),
      };
      console.log('txRequest', txRequest);

      const hash = await walletClient.sendTransaction(txRequest as any);
      setTxHash(hash);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to execute Aave looping transaction');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Aave Leverage Looping
      </h2>

      {!user ? (
        <p className="text-gray-600 dark:text-gray-300">
          Please connect a wallet first to use Aave looping.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Token Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collateral Token
              </label>
              <select
                value={collateralToken}
                onChange={(e) => setCollateralToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USDC">USDC</option>
                <option value="WETH">WETH</option>
                <option value="WBTC">WBTC</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Borrow Token
              </label>
              <select
                value={borrowToken}
                onChange={(e) => setBorrowToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="WETH">WETH</option>
                <option value="USDC">USDC</option>
                <option value="WBTC">WBTC</option>
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Collateral Amount
            </label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter amount"
            />
          </div>

          {/* Leverage and LTV Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leverage Multiplier: {leverage}x
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={leverage}
                onChange={(e) => setLeverage(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1x</span>
                <span>Max: {getMaxLeverage(loanToValue).toFixed(1)}x</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loan-to-Value Ratio: {loanToValue}%
              </label>
              <input
                type="range"
                min="50"
                max="85"
                step="5"
                value={loanToValue}
                onChange={(e) => setLoanToValue(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>50%</span>
                <span>85%</span>
              </div>
            </div>
          </div>

          {/* Max Slippage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Slippage: {maxSlippage}%
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={maxSlippage}
              onChange={(e) => setMaxSlippage(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0.5%</span>
              <span>5%</span>
            </div>
          </div>

          {/* Risk Warning */}
          {!validateLeverage(leverage, loanToValue) && (
            <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ Leverage {leverage}x exceeds maximum {getMaxLeverage(loanToValue).toFixed(2)}x for {loanToValue}% LTV
              </p>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleAaveLooping}
            disabled={isSending || !validateLeverage(leverage, loanToValue)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isSending ? 'Executing Aave Looping…' : 'Execute Aave Looping'}
          </button>

          {txHash && (
            <div className="p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 break-all">
                <span className="font-medium">Transaction Hash:</span> {txHash}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
              {error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

