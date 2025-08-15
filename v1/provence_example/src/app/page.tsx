'use client'

import { useVaults } from '../hooks/useVaults'
import Header from '../components/Header'
import VaultList from '../components/VaultList'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const { vaults, isLoading, error, refreshVaults } = useVaults()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading vaults from Compass API...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-medium text-red-800 mb-2">Failed to Load Vaults</h2>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={refreshVaults}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vault Management Dashboard</h1>
          <p className="mt-2 text-gray-600">
            View all available vaults sorted by APY performance and manage your deposits and withdrawals
          </p>
          
          {/* Vault Stats */}
          {vaults.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500">Total Vaults</p>
                <p className="text-2xl font-bold text-gray-900">{vaults.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500">Highest APY</p>
                <p className="text-2xl font-bold text-green-600">
                  {vaults[0]?.apy ? `${(vaults[0].apy * 100).toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500">Average APY</p>
                <p className="text-2xl font-bold text-blue-600">
                  {vaults.length > 0 
                    ? `${(vaults.reduce((sum, vault) => sum + (vault.apy || 0), 0) / vaults.length * 100).toFixed(2)}%`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Vault List */}
        <VaultList
          vaults={vaults}
          isLoading={isLoading}
          error={error}
          onRefresh={refreshVaults}
        />
      </main>
    </div>
  )
}