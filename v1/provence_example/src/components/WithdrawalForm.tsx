'use client'

import { useState } from 'react'

interface WithdrawalFormProps {
  vaultAddress?: string
}

export default function WithdrawalForm({ vaultAddress }: WithdrawalFormProps) {
  const [asset, setAsset] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState('')

  const availableAssets = ['USDC', 'ETH', 'WBTC', 'DAI']

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !asset || !vaultAddress) {
      alert('Please fill in all required fields and ensure vault is connected')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setTxHash('')

    try {
      // TODO: Integrate with Compass API SDK
      // const compassClient = new CompassClient()
      // const withdrawalTx = await compassClient.withdrawFromVault({
      //   vaultAddress,
      //   asset,
      //   amount: numAmount
      // })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate successful transaction
      setTxHash('0x8765...4321')
      
      // Reset form
      setAmount('')
    } catch (error) {
      console.error('Withdrawal failed:', error)
      alert('Withdrawal failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdraw</h2>
      
      <form onSubmit={handleWithdrawal} className="space-y-4">
        <div>
          <label htmlFor="withdraw-asset" className="block text-sm font-medium text-gray-700 mb-2">
            Asset
          </label>
          <select
            id="withdraw-asset"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {availableAssets.map((assetOption) => (
              <option key={assetOption} value={assetOption}>
                {assetOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            id="withdraw-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !amount || !asset}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>

      {txHash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <span className="font-medium">Withdrawal successful!</span>
          </p>
          <p className="text-xs text-green-600 mt-1">
            Hash: {txHash}
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>• Minimum withdrawal: $50</p>
        <p>• Gas fees apply</p>
        <p>• 24h withdrawal delay may apply</p>
      </div>
    </div>
  )
} 