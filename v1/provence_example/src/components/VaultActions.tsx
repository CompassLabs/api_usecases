'use client'

import { useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { CompassApiSDK } from '@compass-labs/api-sdk'
import { isDynamicWaasConnector } from '@dynamic-labs/wallet-connector-core'
import { getAddress } from 'viem'
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
  const { user, primaryWallet } = useDynamicContext()
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const getCompassSDK = () => {
    const apiKey = process.env.NEXT_PUBLIC_COMPASS_API_KEY
    if (!apiKey) {
      throw new Error('COMPASS_API_KEY not found in environment variables')
    }
    return new CompassApiSDK({ apiKeyAuth: apiKey })
  }

  const getAuthorization = async () => {
    if (!user || !primaryWallet?.address) {
      throw new Error('Please connect a wallet first.')
    }

    try {
      const compassApiSDK = getCompassSDK()
      const sender = primaryWallet.address as `0x${string}`
      
      const authResponse = await compassApiSDK.transactionBundler.transactionBundlerAuthorization({
        chain: "base",
        sender,
      })
      
      console.log('Authorization response:', authResponse)
      return authResponse
    } catch (error) {
      console.error('Failed to get authorization:', error)
      throw error
    }
  }

  const signAuthorization = async (authData: AuthorizationResponse) => {
    if (!primaryWallet) {
      throw new Error('No wallet connected')
    }
    console.log('primaryWallet:', primaryWallet)
    console.log('primaryWallet.address:', primaryWallet.address)
    
    const connector: any = (primaryWallet as any)?.connector
    if (!connector || !isDynamicWaasConnector(connector)) {
      throw new Error('Authorization signing requires an embedded wallet')
    }

    console.log('authData:', authData)
    console.log('connector:', connector)
    console.log('connector type:', connector.constructor?.name)

    try {
      // Get wallet client to ensure connection is established
      const walletClient = await (primaryWallet as any).getWalletClient()
      console.log('walletClient:', walletClient)
      console.log('walletClient.account:', walletClient?.account)
      
      // Sign the authorization using Dynamic connector
      const signedAuth = await (connector as any).signAuthorization(authData)
      console.log('signedAuth:', signedAuth)
      return signedAuth
    } catch (error) {
      console.error('Error during authorization signing:', error)
      throw new Error(`Authorization signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const submitBundledTransaction = async (signedAuth: any, type: 'deposit' | 'withdraw') => {
    if (!primaryWallet?.address) {
      throw new Error('No wallet connected')
    }

    try {
      const compassApiSDK = getCompassSDK()
      const amountValue = parseFloat(amount)
      const sender = primaryWallet.address as `0x${string}`

      const actionType = type === 'deposit' ? 'VAULT_DEPOSIT' : 'VAULT_WITHDRAW'

      const bundledTx = await compassApiSDK.transactionBundler.transactionBundlerExecute({
        chain: "base",
        sender,
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
        signedAuthorization: {
          nonce: signedAuth.nonce,
          address: signedAuth.address,
          chainId: signedAuth.chainId,
          r: signedAuth.r,
          s: signedAuth.s,
          yParity: signedAuth.yParity as number,
        }
      })

      console.log('Bundled transaction result:', bundledTx)
      return bundledTx
    } catch (error) {
      console.error('Failed to submit bundled transaction:', error)
      throw error
    }
  }

  const handleAction = async (type: 'deposit' | 'withdraw') => {
    setError(null)
    setTxHash(null)
    
    if (!user || !primaryWallet?.address) {
      setError('Please connect a wallet first.')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setActionType(type)

    try {
      // Check wallet connection first
      console.log('Step 0: Verifying wallet connection...')
      const walletClient: any = await (primaryWallet as any).getWalletClient()
      console.log('Wallet client ready:', !!walletClient, 'Account:', walletClient?.account)
      
      if (!walletClient || !walletClient.account) {
        throw new Error('Wallet connection not fully established. Please disconnect and reconnect your wallet.')
      }

      console.log('Step 1: Getting authorization...')
      const auth = await getAuthorization()
      
      console.log('Step 2: Signing authorization...')
      const signed = await signAuthorization(auth as unknown as AuthorizationResponse)
      
      console.log('Step 3: Submitting bundled transaction...')
      const result = await submitBundledTransaction(signed, type)
      
      const txRequest = {
        ...result.transaction,
        chainId: Number(result.transaction.chainId),
        value: BigInt(result.transaction.value || '0x0'),
        nonce: result.transaction.nonce ? BigInt(result.transaction.nonce) : undefined,
        gas: result.transaction.gas ? BigInt(result.transaction.gas) : undefined,
        maxFeePerGas: result.transaction.maxFeePerGas ? BigInt(result.transaction.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: result.transaction.maxPriorityFeePerGas ? BigInt(result.transaction.maxPriorityFeePerGas) : undefined,
        to: getAddress(result.transaction.to as `0x${string}`),
        from: getAddress(result.transaction.from as `0x${string}`),
      }
      
      console.log('Step 4: Sending transaction...', txRequest)
      const hash = await walletClient.sendTransaction(txRequest as any)
      setTxHash(hash)
      
      console.log(`${type} transaction result:`, result)
      
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
        } else if (error.message.includes('not fully established')) {
          errorMessage = error.message
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
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
    setError(null)
    setTxHash(null)
  }

  return (
    <>
      {!user ? (
        <p className="text-gray-600 text-sm">
          Please connect a wallet to use vault actions.
        </p>
      ) : (
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