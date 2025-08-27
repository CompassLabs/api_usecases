'use client'

import { useVaults } from '../hooks/useVaults'
import UserPositions from '../components/UserPositions'
import VaultActions from '../components/VaultActions'
import LoadingSpinner from '../components/LoadingSpinner'
import { useMetaMask } from '@/contexts/MetaMaskContext'

interface Vault {
  id: string
  name?: string
  address: string
  chainId?: number
  protocol?: string
  apy?: number
  token?: string
}

export default function Home() {
  const { vaults, isLoading, error, refreshVaults } = useVaults()
  const { wallet, isConnecting, connectWallet, disconnectWallet, switchToBaseChain } = useMetaMask()

  const formatAPY = (apy?: number) => {
    if (!apy) return 'N/A'
    return `${(apy * 100).toFixed(2)}%`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading vaults...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Vault Dashboard</h1>
            <div className="flex items-center space-x-4">
              {!wallet ? (
                <button 
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className={`${
                    isConnecting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2`}
                >
                  {isConnecting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-sm text-gray-600 block">
                      {`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      {wallet.chainId === 8453 ? 'Base' : `Chain ${wallet.chainId}`}
                    </span>
                  </div>
                  {wallet.chainId !== 8453 && (
                    <button
                      onClick={switchToBaseChain}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-1 px-3 rounded text-sm"
                    >
                      Switch to Base
                    </button>
                  )}
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Positions */}
        <UserPositions />

        {/* Vaults Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Available Vaults</h2>
              <button
                onClick={refreshVaults}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {vaults.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No vaults available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {vaults.map((vault) => (
                <div key={vault.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {vault.name || `Vault ${vault.address.slice(0, 6)}...${vault.address.slice(-4)}`}
                        </h3>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-600">
                            {formatAPY(vault.apy)}
                          </span>
                          <p className="text-sm text-gray-500">APY</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Protocol</p>
                          <p className="font-medium text-gray-900">{vault.protocol || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-mono text-sm text-gray-900">
                            {vault.address.slice(0, 10)}...{vault.address.slice(-8)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <VaultActions
                          vaultAddress={vault.address}
                          vaultName={vault.name || `Vault ${vault.address.slice(0, 6)}...${vault.address.slice(-4)}`}
                          vaultToken={vault.token || 'USDC'}
                          onSuccess={() => refreshVaults()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}