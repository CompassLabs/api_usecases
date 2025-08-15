'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import VaultActions from './VaultActions'

interface Vault {
  id: string
  name?: string
  address: string
  chainId?: number
  protocol?: string
  apy?: number
  token?: string
}

interface VaultListProps {
  vaults: Vault[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

export default function VaultList({
  vaults,
  isLoading,
  error,
  onRefresh
}: VaultListProps) {
  const [refreshingVaults, setRefreshingVaults] = useState<Set<string>>(new Set())

  const handleActionSuccess = (vaultId: string) => {
    setRefreshingVaults(prev => new Set(prev).add(vaultId))
    
    setTimeout(() => {
      setRefreshingVaults(prev => {
        const newSet = new Set(prev)
        newSet.delete(vaultId)
        return newSet
      })
      onRefresh()
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-gray-600">Loading vaults...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (vaults.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">No vaults found</p>
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  const formatAPY = (apy: number | undefined) => {
    if (apy === undefined || apy === 0) return 'N/A'
    return `${(apy * 100).toFixed(2)}%`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Available Vaults</h2>
          <p className="text-sm text-gray-500">
            {vaults.length} vaults sorted by APY (highest first)
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vault
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Protocol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                APY
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vaults.map((vault, index) => (
              <tr key={vault.id} className={`hover:bg-gray-50 ${
                refreshingVaults.has(vault.id) ? 'bg-blue-50' : ''
              }`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{vault.name}</div>
                  {vault.chainId && (
                    <div className="text-xs text-gray-500">Chain ID: {vault.chainId}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {vault.protocol}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-semibold ${
                    vault.apy && vault.apy > 0.05 ? 'text-green-600' : 
                    vault.apy && vault.apy > 0.02 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {formatAPY(vault.apy)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {refreshingVaults.has(vault.id) ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-xs text-blue-600">Updating...</span>
                    </div>
                  ) : (
                    <VaultActions
                      vaultAddress={vault.address}
                      vaultName={vault.name || `Vault ${vault.address.slice(0, 6)}...${vault.address.slice(-4)}`}
                      vaultToken={vault.token || 'USDC'}
                      onSuccess={() => handleActionSuccess(vault.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing {vaults.length} vaults • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
} 