'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface VaultBalance {
  asset: string
  balance: string
  value: string
  allocation: number
}

interface VaultOverviewProps {
  vaultAddress?: string
}

export default function VaultOverview({ vaultAddress }: VaultOverviewProps) {
  const [balances, setBalances] = useState<VaultBalance[]>([
    { asset: 'USDC', balance: '100,000.00', value: '$100,000.00', allocation: 40 },
    { asset: 'ETH', balance: '50.00', value: '$75,000.00', allocation: 30 },
    { asset: 'WBTC', balance: '2.50', value: '$75,000.00', allocation: 30 }
  ])
  const [totalValue, setTotalValue] = useState('$250,000.00')
  const [isLoading, setIsLoading] = useState(false)

  const refreshBalances = async () => {
    try {
      setIsLoading(true)
      // TODO: Integrate with Compass API SDK
      // const compassClient = new CompassClient()
      // const vaultData = await compassClient.getVaultBalances(vaultAddress)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vault Overview</h2>
          <p className="text-sm text-gray-500">
            {vaultAddress && vaultAddress.length > 10 
              ? `Vault: ${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}` 
              : 'No vault connected'
            }
          </p>
        </div>
        <button
          onClick={refreshBalances}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading && <LoadingSpinner size="sm" />}
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">{totalValue}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">Assets</p>
          <p className="text-2xl font-bold text-gray-900">{balances.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">Status</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Allocation</h3>
        <div className="space-y-3">
          {balances.map((balance, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium text-gray-900">{balance.asset}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900">{balance.balance}</p>
                <p className="text-xs text-gray-500">{balance.value}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{balance.allocation}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 