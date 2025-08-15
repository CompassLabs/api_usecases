'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface Vault {
  id: string
  name?: string
  address: string
  chainId?: number
  protocol?: string
}

interface VaultSelectorProps {
  vaults: Vault[]
  selectedVault: Vault | null
  onVaultSelect: (vault: Vault) => void
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

export default function VaultSelector({
  vaults,
  selectedVault,
  onVaultSelect,
  isLoading,
  error,
  onRefresh
}: VaultSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-gray-600">Loading vaults...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Select Vault</h3>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="truncate">
            {selectedVault ? (
              <span>
                <span className="font-medium">{selectedVault.name}</span>
                <span className="text-gray-500 ml-2">
                  ({selectedVault.address.slice(0, 6)}...{selectedVault.address.slice(-4)})
                </span>
              </span>
            ) : (
              'Select a vault'
            )}
          </span>
          <svg
            className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {vaults.map((vault) => (
              <button
                key={vault.id}
                onClick={() => {
                  onVaultSelect(vault)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                  selectedVault?.id === vault.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="font-medium">{vault.name}</div>
                <div className="text-xs text-gray-500">
                  {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
                  {vault.protocol && ` • ${vault.protocol}`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedVault && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <div>Protocol: {selectedVault.protocol}</div>
          {selectedVault.chainId && <div>Chain ID: {selectedVault.chainId}</div>}
        </div>
      )}
    </div>
  )
} 