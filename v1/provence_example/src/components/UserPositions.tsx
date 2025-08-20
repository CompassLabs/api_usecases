'use client'

import { useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { isDynamicWaasConnector } from '@dynamic-labs/wallet-connector-core'
import { CompassApiSDK } from '@compass-labs/api-sdk'
import { getAddress } from 'viem'
import { useUserPositions } from '../hooks/useUserPositions'
import LoadingSpinner from './LoadingSpinner'

export default function UserPositions() {
  const { positions, isLoading, error, refreshPositions, hasWallet } = useUserPositions()
  const { user, primaryWallet } = useDynamicContext()
  const [rebalancePercentages, setRebalancePercentages] = useState<Record<string, string>>({})
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [rebalanceError, setRebalanceError] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null)
  
  // Withdraw functionality state
  const [withdrawModal, setWithdrawModal] = useState<{ isOpen: boolean; vaultId: string | null }>({ isOpen: false, vaultId: null })
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null)

  if (!hasWallet) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Positions</h2>
        <p className="text-gray-600 text-center py-8">
          Connect your wallet to view your existing vault positions
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Positions</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <LoadingSpinner size="md" />
            <p className="mt-4 text-gray-600">Loading your positions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Positions</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={refreshPositions}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!positions || (!positions.vaultPositions?.length && !positions.marketPositions?.length)) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Positions</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">No positions found</p>
          <p className="text-gray-500 text-sm">Make your first deposit to get started</p>
        </div>
      </div>
    )
  }

  const formatUSD = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }

  const formatPercentage = (value: string) => {
    const num = parseFloat(value) * 100
    if (isNaN(num)) return '0.00%'
    return `${num.toFixed(2)}%`
  }

  const handlePercentageChange = (vaultId: string, percentage: string) => {
    // Only allow numbers and decimal points
    if (percentage === '' || /^\d*\.?\d*$/.test(percentage)) {
      setRebalancePercentages(prev => ({
        ...prev,
        [vaultId]: percentage
      }))
    }
  }

  const getTotalPercentage = () => {
    return Object.values(rebalancePercentages).reduce((sum, percent) => {
      const num = parseFloat(percent || '0')
      return sum + (isNaN(num) ? 0 : num)
    }, 0)
  }

  const handleRebalance = async () => {
    if (!positions?.vaultPositions || !user || !primaryWallet?.address) {
      setRebalanceError('Please connect your wallet first')
      return
    }

    setRebalanceError(null)
    setTransactionStatus(null)
    const totalPercentage = getTotalPercentage()
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setRebalanceError(`Total percentage must equal 100%. Current total: ${totalPercentage.toFixed(2)}%`)
      return
    }

    setIsRebalancing(true)
    setTransactionStatus('Preparing rebalance transaction...')
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_COMPASS_API_KEY
      if (!apiKey) {
        throw new Error('COMPASS_API_KEY not found in environment variables')
      }

      const compassApiSDK = new CompassApiSDK({ apiKeyAuth: apiKey })
      const walletAddress = primaryWallet.address as `0x${string}`
      
      console.log('Rebalancing with percentages:', rebalancePercentages)
      
      // Build vault actions array
      let vault_actions: any[] = []
      let totalAmount = 0
      
      // Calculate total amount across all positions
      for (const position of positions.vaultPositions) {
        const amountBefore = parseFloat(position.state.assets) / Math.pow(10, position.vault.asset.decimals)
        totalAmount += amountBefore
      }

      // Add allowances for all vault tokens
      for (const position of positions.vaultPositions) {
        vault_actions.push({
          body: {
            actionType: 'SET_ALLOWANCE',
            token: position.vault.asset.address,
            contract: position.vault.address,
            amount: (totalAmount * 10).toString(),
          }
        })
      }

      setTransactionStatus('Calculating rebalance amounts...')
      
      let totalRebalanceAmount = 0
      
      // Withdraw all positions and deposit based on new allocation
      for (const position of positions.vaultPositions) {
        const vaultAddress = position.vault.address
        
        // Withdraw all from this vault
        vault_actions.push({
          body: {
            actionType: 'VAULT_WITHDRAW',
            vaultAddress: vaultAddress,
            amount: 'ALL',
          }
        })

        // Calculate rebalance amount based on percentage
        const targetPercentage = parseFloat(rebalancePercentages[position.id] || '0')
        const rebalanceAmount = (targetPercentage * totalAmount) / 100
        
        console.log("rebalanceAmount", rebalanceAmount, targetPercentage, totalAmount)
        
        if (rebalanceAmount > 0) {
          vault_actions.push({
            body: {
              actionType: 'VAULT_DEPOSIT',
              vaultAddress: vaultAddress,
              amount: rebalanceAmount.toString(),
            }
          })
        }
        
        totalRebalanceAmount += rebalanceAmount
      }

      if (totalRebalanceAmount > totalAmount * 1.01) { // Allow 1% tolerance
        setRebalanceError('Total rebalance amount is greater than total amount')
        return
      }

      setTransactionStatus('Getting authorization...')
      
      // Get authorization for transaction bundling
      const auth = await compassApiSDK.transactionBundler.transactionBundlerAuthorization({
        chain: 'base',
        sender: walletAddress,
      })

      setTransactionStatus('Signing authorization...')
      
      // Verify wallet connection first
      const walletClient: any = await (primaryWallet as any).getWalletClient()
      console.log('Wallet client ready:', !!walletClient, 'Account:', walletClient?.account)
      
      if (!walletClient || !walletClient.account) {
        throw new Error('Wallet connection not fully established. Please disconnect and reconnect your wallet.')
      }
      
      // Sign authorization using Dynamic connector
      const connector: any = (primaryWallet as any)?.connector
      if (!connector || !isDynamicWaasConnector(connector)) {
        throw new Error('Authorization signing requires an embedded wallet')
      }

      console.log('primaryWallet:', primaryWallet)
      console.log('connector:', connector)
      console.log('connector type:', connector.constructor?.name)
      console.log('auth data:', auth)

      let signedAuth
      try {
        signedAuth = await (connector as any).signAuthorization(auth)
        console.log('signedAuth:', signedAuth)
        
        if (!signedAuth) {
          throw new Error('Authorization signing returned empty result')
        }
      } catch (authError) {
        console.error('Authorization signing error:', authError)
        throw new Error(`Authorization signing failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`)
      }
      
      setTransactionStatus('Executing bundled transaction...')
      
      // Execute bundled transaction
      const bundledTx = await compassApiSDK.transactionBundler.transactionBundlerExecute({
        chain: 'base',
        sender: walletAddress,
        actions: vault_actions,
        signedAuthorization: {
          nonce: signedAuth.nonce,
          address: signedAuth.address,
          chainId: signedAuth.chainId,
          r: signedAuth.r,
          s: signedAuth.s,
          yParity: signedAuth.yParity as number,
        }
      })

      setTransactionStatus('Sending transaction...')
      
      const txRequest = {
        ...bundledTx.transaction,
        chainId: Number(bundledTx.transaction.chainId),
        value: BigInt(bundledTx.transaction.value || '0x0'),
        nonce: bundledTx.transaction.nonce ? BigInt(bundledTx.transaction.nonce) : undefined,
        gas: bundledTx.transaction.gas ? BigInt(bundledTx.transaction.gas) : undefined,
        maxFeePerGas: bundledTx.transaction.maxFeePerGas ? BigInt(bundledTx.transaction.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: bundledTx.transaction.maxPriorityFeePerGas ? BigInt(bundledTx.transaction.maxPriorityFeePerGas) : undefined,
        to: getAddress(bundledTx.transaction.to as `0x${string}`),
        from: getAddress(bundledTx.transaction.from as `0x${string}`),
      }
      
      const txHash = await walletClient.sendTransaction(txRequest as any)
      
      setTransactionStatus(`Transaction submitted! Hash: ${txHash}. Waiting for confirmation...`)
      
      console.log('Rebalance transaction hash:', txHash)
      
      // Wait a bit for transaction to be processed
      setTimeout(() => {
        refreshPositions()
        setRebalancePercentages({})
        setTransactionStatus(`Rebalance completed! Transaction: ${txHash}`)
      }, 3000)
      
    } catch (error) {
      console.error('Rebalancing failed:', error)
      
      let errorMessage = 'Rebalancing failed. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for rebalancing'
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas issues. Please try again.'
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled by user'
        } else if (error.message.includes('authorization')) {
          errorMessage = 'Authorization failed. Please try again.'
        } else if (error.message.includes('not fully established')) {
          errorMessage = error.message
        } else if (error.message.includes('signer.account')) {
          errorMessage = 'Wallet connection issue. Please disconnect and reconnect your wallet.'
        } else {
          errorMessage = error.message
        }
      }
      
      setRebalanceError(errorMessage)
      setTransactionStatus(null)
    } finally {
      setIsRebalancing(false)
    }
  }

  const getCurrentAllocation = (vaultId: string) => {
    if (!positions?.vaultPositions) return 0
    
    const totalValue = parseFloat(positions.state?.vaultsAssetsUsd || '0')
    const vaultPosition = positions.vaultPositions.find(p => p.id === vaultId)
    const vaultValue = parseFloat(vaultPosition?.state.assetsUsd || '0')
    
    return totalValue > 0 ? (vaultValue / totalValue) * 100 : 0
  }

  // Withdraw functionality methods
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
      
      return authResponse
    } catch (error) {
      console.error('Failed to get authorization:', error)
      throw error
    }
  }

  const signAuthorization = async (authData: any) => {
    if (!primaryWallet) {
      throw new Error('No wallet connected')
    }
    
    const connector: any = (primaryWallet as any)?.connector
    if (!connector || !isDynamicWaasConnector(connector)) {
      throw new Error('Authorization signing requires an embedded wallet')
    }

    try {
      const walletClient = await (primaryWallet as any).getWalletClient()
      if (!walletClient || !walletClient.account) {
        throw new Error('Wallet connection not fully established. Please disconnect and reconnect your wallet.')
      }
      
      const signedAuth = await (connector as any).signAuthorization(authData)
      return signedAuth
    } catch (error) {
      console.error('Error during authorization signing:', error)
      throw new Error(`Authorization signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleWithdraw = async (vaultId: string) => {
    setWithdrawError(null)
    setWithdrawTxHash(null)
    
    if (!user || !primaryWallet?.address) {
      setWithdrawError('Please connect a wallet first.')
      return
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWithdrawError('Please enter a valid amount')
      return
    }

    const vaultPosition = positions?.vaultPositions?.find(p => p.id === vaultId)
    if (!vaultPosition) {
      setWithdrawError('Vault position not found')
      return
    }

    setIsWithdrawing(true)

    try {
      console.log('Step 1: Getting authorization...')
      const auth = await getAuthorization()
      
      console.log('Step 2: Signing authorization...')
      const signed = await signAuthorization(auth)
      
      console.log('Step 3: Submitting bundled transaction...')
      const compassApiSDK = getCompassSDK()
      const amountValue = parseFloat(withdrawAmount)
      const sender = primaryWallet.address as `0x${string}`

      const bundledTx = await compassApiSDK.transactionBundler.transactionBundlerExecute({
        chain: "base",
        sender,
        actions: [
          {
            body: {
              contract: vaultPosition.vault.address,
              amount: amountValue.toString(),
              actionType: "SET_ALLOWANCE",
              token: vaultPosition.vault.asset.address
            }
          },
          {
            body: {
              vaultAddress: vaultPosition.vault.address,
              amount: amountValue.toString(),
              actionType: "VAULT_WITHDRAW"
            }
          }
        ],
        signedAuthorization: {
          nonce: signed.nonce,
          address: signed.address,
          chainId: signed.chainId,
          r: signed.r,
          s: signed.s,
          yParity: signed.yParity as number,
        }
      })

      const walletClient: any = await (primaryWallet as any).getWalletClient()
      
      const txRequest = {
        ...bundledTx.transaction,
        chainId: Number(bundledTx.transaction.chainId),
        value: BigInt(bundledTx.transaction.value || '0x0'),
        nonce: bundledTx.transaction.nonce ? BigInt(bundledTx.transaction.nonce) : undefined,
        gas: bundledTx.transaction.gas ? BigInt(bundledTx.transaction.gas) : undefined,
        maxFeePerGas: bundledTx.transaction.maxFeePerGas ? BigInt(bundledTx.transaction.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: bundledTx.transaction.maxPriorityFeePerGas ? BigInt(bundledTx.transaction.maxPriorityFeePerGas) : undefined,
        to: getAddress(bundledTx.transaction.to as `0x${string}`),
        from: getAddress(bundledTx.transaction.from as `0x${string}`),
      }
      
      console.log('Step 4: Sending transaction...', txRequest)
      const hash = await walletClient.sendTransaction(txRequest as any)
      setWithdrawTxHash(hash)
      
      setWithdrawAmount('')
      setWithdrawModal({ isOpen: false, vaultId: null })
      refreshPositions()
      
    } catch (error) {
      console.error('Withdraw failed:', error)
      
      let errorMessage = 'Withdrawal failed. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for withdrawal'
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas issues. Please try again.'
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled by user'
        } else if (error.message.includes('authorization')) {
          errorMessage = 'Authorization failed. Please try again.'
        } else if (error.message.includes('not fully established')) {
          errorMessage = error.message
        } else {
          errorMessage = error.message
        }
      }
      
      setWithdrawError(errorMessage)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const openWithdrawModal = (vaultId: string) => {
    setWithdrawModal({ isOpen: true, vaultId })
    setWithdrawError(null)
    setWithdrawTxHash(null)
    setWithdrawAmount('')
  }

  const closeWithdrawModal = () => {
    setWithdrawModal({ isOpen: false, vaultId: null })
    setWithdrawAmount('')
    setWithdrawError(null)
    setWithdrawTxHash(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Positions</h2>
        <button
          onClick={refreshPositions}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-600">Total Assets</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatUSD(positions.state?.vaultsAssetsUsd || '0')}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Active Positions</p>
          <p className="text-2xl font-bold text-gray-900">
            {positions.vaultPositions?.length || 0}
          </p>
        </div>
      </div>

      {/* Vault Positions */}
      {positions.vaultPositions && positions.vaultPositions.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Vault Positions</h3>
            <div className="text-sm text-gray-600">
              Total: {getTotalPercentage().toFixed(1)}% / 100%
            </div>
          </div>
          
          <div className="space-y-4">
            {positions.vaultPositions.map((position, index) => {
              const positionPnl = parseFloat(position.state.pnlUsd)
              const currentAllocation = getCurrentAllocation(position.id)
              const targetPercentage = rebalancePercentages[position.id] || ''
              
              return (
                <div key={position.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{position.vault.name}</h4>
                      <p className="text-sm text-gray-600">
                        {position.vault.asset.symbol} • {position.vault.address.slice(0, 6)}...{position.vault.address.slice(-4)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Current: {currentAllocation.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatUSD(position.state.assetsUsd)}</p>
                      <p className={`text-sm ${positionPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {positionPnl >= 0 ? '+' : ''}{formatUSD(position.state.pnlUsd)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs mb-3">
                    <div>
                      <p className="text-gray-500">Assets</p>
                      <p className="font-medium text-gray-900">
                        {(parseFloat(position.state.assets) / Math.pow(10, position.vault.asset.decimals)).toFixed(4)} {position.vault.asset.symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Daily APY</p>
                      <p className="font-medium text-gray-900">
                        {formatPercentage(position.vault.dailyApys.netApy)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Monthly APY</p>
                      <p className="font-medium text-gray-900">
                        {formatPercentage(position.vault.monthlyApys.netApy)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Target Allocation %</p>
                      <input
                        type="text"
                        value={targetPercentage}
                        onChange={(e) => handlePercentageChange(position.id, e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-xs text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isRebalancing}
                      />
                    </div>
                  </div>
                  
                  {/* Withdraw Button */}
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => openWithdrawModal(position.id)}
                      disabled={isRebalancing || isWithdrawing}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rebalance Controls */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">Portfolio Rebalancing</h4>
                <p className="text-sm text-gray-600">
                  Set target percentages for each vault and rebalance your portfolio
                </p>
                {rebalanceError && (
                  <p className="text-sm text-red-600 mt-1">{rebalanceError}</p>
                )}
                {transactionStatus && (
                  <p className="text-sm text-blue-600 mt-1">{transactionStatus}</p>
                )}
              </div>
              <button
                onClick={handleRebalance}
                disabled={isRebalancing || getTotalPercentage() === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isRebalancing && <LoadingSpinner size="sm" />}
                <span>{isRebalancing ? 'Rebalancing...' : 'Rebalance Portfolio'}</span>
              </button>
            </div>
            
            <div className="mt-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total Allocation:</span>
                <span className={getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}>
                  {getTotalPercentage().toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModal.isOpen && withdrawModal.vaultId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">
                Withdraw from {positions?.vaultPositions?.find(p => p.id === withdrawModal.vaultId)?.vault.name || 'Vault'}
              </h3>
              <button
                onClick={closeWithdrawModal}
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
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                disabled={isWithdrawing}
              />
            </div>

            {withdrawModal.vaultId && (
              <div className="mb-4 text-xs text-black">
                {(() => {
                  const vaultPosition = positions?.vaultPositions?.find(p => p.id === withdrawModal.vaultId)
                  if (!vaultPosition) return null
                  const availableAmount = parseFloat(vaultPosition.state.assets) / Math.pow(10, vaultPosition.vault.asset.decimals)
                  return (
                    <>
                      <p>Vault: {vaultPosition.vault.address.slice(0, 6)}...{vaultPosition.vault.address.slice(-4)}</p>
                      <p>Token: {vaultPosition.vault.asset.symbol}</p>
                      <p>Available: {availableAmount.toFixed(4)} {vaultPosition.vault.asset.symbol}</p>
                      <p className="mt-1 text-gray-600">This will use the transaction bundler for gas optimization.</p>
                    </>
                  )
                })()}
              </div>
            )}

            {withdrawTxHash && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 break-all">
                  <span className="font-medium">Transaction Hash:</span> {withdrawTxHash}
                </p>
              </div>
            )}

            {withdrawError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  {withdrawError}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => withdrawModal.vaultId && handleWithdraw(withdrawModal.vaultId)}
                disabled={isWithdrawing || !withdrawAmount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isWithdrawing && <LoadingSpinner size="sm" />}
                <span>{isWithdrawing ? 'Processing...' : 'Submit Withdrawal'}</span>
              </button>
              <button
                onClick={closeWithdrawModal}
                disabled={isWithdrawing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}