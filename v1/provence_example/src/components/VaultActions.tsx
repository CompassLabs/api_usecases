'use client'

import { useState } from 'react'
import { CompassApiSDK } from '@compass-labs/api-sdk'
import LoadingSpinner from './LoadingSpinner'

interface VaultActionsProps {
  vaultAddress: string
  vaultName: string
  vaultToken: string
  onSuccess?: () => void
}

interface AuthorizationResponse {
  nonce: number
  address: string
  chain_id: number
  r: string
  s: string
  y_parity: number
}

export default function VaultActions({ vaultAddress, vaultName, vaultToken, onSuccess }: VaultActionsProps) {
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null)
  const [authData, setAuthData] = useState<AuthorizationResponse | null>(null)
  const [signedAuth, setSignedAuth] = useState<any>(null)

  const getCompassSDK = () => {
    const apiKey = process.env.NEXT_PUBLIC_COMPASS_API_KEY
    if (!apiKey) {
      throw new Error('COMPASS_API_KEY not found in environment variables')
    }
    return new CompassApiSDK({ apiKeyAuth: apiKey })
  }

  const getAuthorization = async () => {
    try {
      const compassApiSDK = getCompassSDK()
      
      const authResponse = await compassApiSDK.transactionBundler.transactionBundlerAuthorization({
        chain: "base",
        sender: "0x0000000000000000000000000000000000000000",
      })
      
      console.log('Authorization response:', authResponse)
      setAuthData(authResponse as unknown as AuthorizationResponse)
      return authResponse
    } catch (error) {
      console.error('Failed to get authorization:', error)
      throw error
    }
  }

  const signAuthorization = async (authData: AuthorizationResponse) => {
    // TODO: this needs to be implemented by provence
  }

  const submitBundledTransaction = async (signedAuth: any, type: 'deposit' | 'withdraw') => {
    try {
      const compassApiSDK = getCompassSDK()
      const amountValue = parseFloat(amount)

      const actionType = type === 'deposit' ? 'VAULT_DEPOSIT' : 'VAULT_WITHDRAW'

      const bundledTx = await compassApiSDK.transactionBundler.transactionBundlerExecute({
        chain: "base",
        sender: "0x0000000000000000000000000000000000000000",
        actions: [
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
              actionType: actionType
            }
          }
        ],
        signedAuthorization: signedAuth
      })

      console.log('Bundled transaction result:', bundledTx)
      return bundledTx
    } catch (error) {
      console.error('Failed to submit bundled transaction:', error)
      throw error
    }
  }

  const handleAction = async (type: 'deposit' | 'withdraw') => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setActionType(type)

    try {
      console.log('Step 1: Getting authorization...')
      const auth = await getAuthorization()
      
      console.log('Step 2: Signing authorization...')
      const signed = await signAuthorization(auth as unknown as AuthorizationResponse)
      
      console.log('Step 3: Submitting bundled transaction...')
      const result = await submitBundledTransaction(signed, type)
      
      console.log(`${type} transaction result:`, result)
      alert(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} transaction submitted successfully!`)
      
      setAmount('')
      setIsDepositOpen(false)
      setIsWithdrawOpen(false)
      
      onSuccess?.()
    } catch (error) {
      console.error(`${type} failed:`, error)
      
      let errorMessage = `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} failed. Please try again.`
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = `Insufficient balance for ${type}`
        } else if (error.message.includes('gas')) {
          errorMessage = `Transaction failed due to gas issues. Please try again.`
        } else if (error.message.includes('user rejected')) {
          errorMessage = `Transaction was cancelled by user`
        } else if (error.message.includes('authorization')) {
          errorMessage = `Authorization failed. Please try again.`
        } else {
          errorMessage = error.message
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  const openModal = (type: 'deposit' | 'withdraw') => {
    setActionType(type)
    if (type === 'deposit') {
      setIsDepositOpen(true)
    } else {
      setIsWithdrawOpen(true)
    }
  }

  const closeModal = () => {
    setIsDepositOpen(false)
    setIsWithdrawOpen(false)
    setAmount('')
    setActionType(null)
    setAuthData(null)
    setSignedAuth(null)
  }

  return (
    <>
      <div className="flex space-x-2">
        <button
          onClick={() => openModal('deposit')}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          Deposit
        </button>
        <button
          onClick={() => openModal('withdraw')}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
        >
          Withdraw
        </button>
      </div>

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

            <div className="flex space-x-3">
              <button
                onClick={() => handleAction('deposit')}
                disabled={isLoading || !amount}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && actionType === 'deposit' && <LoadingSpinner size="sm" />}
                <span>{isLoading && actionType === 'deposit' ? 'Processing...' : 'Submit Transaction'}</span>
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

      {isWithdrawOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">Withdraw from {vaultName}</h3>
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
                Amount to Withdraw
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

            <div className="flex space-x-3">
              <button
                onClick={() => handleAction('withdraw')}
                disabled={isLoading || !amount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && actionType === 'withdraw' && <LoadingSpinner size="sm" />}
                <span>{isLoading && actionType === 'withdraw' ? 'Processing...' : 'Submit Transaction'}</span>
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