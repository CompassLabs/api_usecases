'use client'

import { useState } from 'react'
import { useMetaMask, getMetaMaskProvider } from '@/contexts/MetaMaskContext'
import { getAddress } from 'viem'
import LoadingSpinner from './LoadingSpinner'
import { getCompassSDK } from '@/utils/compass'

interface VaultActionsProps {
  vaultAddress: string
  vaultName: string
  vaultToken: string
  onSuccess?: () => void
}



export default function VaultActions({ vaultAddress, vaultName, vaultToken, onSuccess }: VaultActionsProps) {
  const { wallet } = useMetaMask()
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Simplified deposit using standard MetaMask transactions

  const handleDeposit = async () => {
    setError(null)
    setTxHash(null)
    
    if (!wallet?.address) {
      setError('Please connect your MetaMask wallet first.')
      return
    }

    if (wallet.chainId !== 8453) {
      setError('Please switch to Base network to deposit.')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)

    try {
      console.log('Preparing deposit transaction...')
      const compassApiSDK = getCompassSDK()
      const amountValue = parseFloat(amount)
      const sender = getAddress(wallet.address)

      const batchedOps = await compassApiSDK.smartAccount.smartAccountBatchedUserOperations({
        chain: "base" as any,
        sender,
        operations: [
          {
            body: {
              contract: vaultAddress,
              amount: amountValue.toString(),
              actionType: "SET_ALLOWANCE",
              token: vaultToken
            }
          },
          {
            body: {
              vaultAddress: vaultAddress,
              amount: amountValue.toString(),
              actionType: "VAULT_DEPOSIT"
            }
          }
        ],
      })

      console.log('Sending deposit transaction...')
      
      // Format calls for EIP-5792
      const calls = batchedOps.operations.map((call: any) => ({
        to: call.to,
        data: call.data,
        value: `0x${call.value.toString(16)}`,
      }));

      const txRequest = {
        method: 'wallet_sendCalls',
        params: [{
          version: '2.0.0',
          chainId: "0x2105", // Base chain ID
          atomicRequired: true,
          calls: calls,
          from: sender,
        }],
      };

      // Use the robust provider helper with retry logic
      let result;
      try {
        const provider = await getMetaMaskProvider();
        result = await provider.request(txRequest);
      } catch (providerError: any) {
        if (providerError.message?.includes('No active wallet')) {
          throw new Error('MetaMask is locked or not connected. Please unlock MetaMask and try again.');
        }
        throw providerError;
      }
      
      const hash = result?.id || 'Transaction submitted';
      setTxHash(hash)
      
      console.log('Deposit transaction result:', result)
      
      setAmount('')
      setIsDepositOpen(false)
      
      onSuccess?.()
    } catch (error) {
      console.error('Deposit failed:', error)
      
      let errorMessage = 'Deposit failed. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for deposit'
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas issues. Please try again.'
        } else if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled by user'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const openDepositModal = () => {
    setIsDepositOpen(true)
    setError(null)
    setTxHash(null)
    setAmount('')
  }

  const closeModal = () => {
    setIsDepositOpen(false)
    setAmount('')
    setError(null)
    setTxHash(null)
  }

  return (
    <>
      {!wallet ? (
        <p className="text-gray-600 text-sm">
          Please connect your MetaMask wallet to use vault actions.
        </p>
      ) : wallet.chainId !== 8453 ? (
        <p className="text-orange-600 text-sm">
          Please switch to Base network to use vault actions.
        </p>
      ) : (
        <button
          onClick={openDepositModal}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          Deposit
        </button>
      )}

      {isDepositOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">Deposit to {vaultName}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Amount to Deposit
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4 text-xs text-black">
              <p>Vault: {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}</p>
              <p>Token: {vaultToken}</p>
              <p className="mt-1 text-gray-600">This will use the transaction bundler for gas optimization.</p>
            </div>

            {txHash && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 break-all">
                  <span className="font-medium">Transaction Hash:</span> {txHash}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleDeposit}
                disabled={isLoading || !amount}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                <span>{isLoading ? 'Processing...' : 'Submit Transaction'}</span>
              </button>
              <button
                onClick={closeModal}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 