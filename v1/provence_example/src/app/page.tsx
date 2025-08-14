import Header from '@/components/Header'
import VaultOverview from '@/components/VaultOverview'
import DepositForm from '@/components/DepositForm'
import WithdrawalForm from '@/components/WithdrawalForm'
import RebalanceForm from '@/components/RebalanceForm'

export default function Home() {
  // Mock vault address - replace with actual vault connection logic
  const mockVaultAddress = '0x1234567890abcdef1234567890abcdef12345678'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vault Rebalance Demo</h1>
          <p className="mt-2 text-gray-600">
            Manage your vault operations: deposit, withdraw, and rebalance assets
          </p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">
              Vault Connected: {mockVaultAddress.slice(0, 6)}...{mockVaultAddress.slice(-4)}
            </span>
          </div>
        </div>

        {/* Vault Overview */}
        <VaultOverview vaultAddress={mockVaultAddress} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Deposit Form */}
          <div className="lg:col-span-1">
            <DepositForm vaultAddress={mockVaultAddress} />
          </div>

          {/* Withdrawal Form */}
          <div className="lg:col-span-1">
            <WithdrawalForm vaultAddress={mockVaultAddress} />
          </div>

          {/* Rebalance Form */}
          <div className="lg:col-span-1">
            <RebalanceForm vaultAddress={mockVaultAddress} />
          </div>
        </div>
      </main>
    </div>
  )
}