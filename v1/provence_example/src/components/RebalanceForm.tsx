'use client'

import { useState } from 'react'

interface RebalanceFormProps {
  vaultAddress?: string
}

interface TargetAllocation {
  asset: string
  target: number
  current: number
}

export default function RebalanceForm({ vaultAddress }: RebalanceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [allocations, setAllocations] = useState<TargetAllocation[]>([
    { asset: 'USDC', target: 40, current: 40 },
    { asset: 'ETH', target: 30, current: 30 },
    { asset: 'WBTC', target: 30, current: 30 }
  ])

  const handleAllocationChange = (index: number, value: number) => {
    const newAllocations = [...allocations]
    newAllocations[index].target = value
    setAllocations(newAllocations)
  }

  const getTotalAllocation = () => {
    return allocations.reduce((sum, allocation) => sum + allocation.target, 0)
  }

  const handleRebalance = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!vaultAddress) {
      alert('Please ensure vault is connected')
      return
    }
    
    const total = getTotalAllocation()
    if (total !== 100) {
      alert('Total allocation must equal 100%')
      return
    }

    setIsLoading(true)
    setTxHash('')

    try {
      // TODO: Integrate with Compass API SDK
      // const compassClient = new CompassClient()
      // const rebalanceTx = await compassClient.rebalanceVault({
      //   vaultAddress,
      //   targetAllocations: allocations.map(a => ({
      //     asset: a.asset,
      //     targetAllocation: a.target / 100
      //   }))
      // })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate successful transaction
      setTxHash('0xabcd...efgh')
      
      // Update current allocations to match targets
      setAllocations(prev => prev.map(a => ({ ...a, current: a.target })))
    } catch (error) {
      console.error('Rebalance failed:', error)
      alert('Rebalance failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const quickRebalance = (preset: string) => {
    switch (preset) {
      case 'conservative':
        setAllocations([
          { asset: 'USDC', target: 60, current: 40 },
          { asset: 'ETH', target: 25, current: 30 },
          { asset: 'WBTC', target: 15, current: 30 }
        ])
        break
      case 'balanced':
        setAllocations([
          { asset: 'USDC', target: 40, current: 40 },
          { asset: 'ETH', target: 30, current: 30 },
          { asset: 'WBTC', target: 30, current: 30 }
        ])
        break
      case 'aggressive':
        setAllocations([
          { asset: 'USDC', target: 20, current: 40 },
          { asset: 'ETH', target: 40, current: 30 },
          { asset: 'WBTC', target: 40, current: 30 }
        ])
        break
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Rebalance</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">Quick Presets:</p>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => quickRebalance('conservative')}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
          >
            Conservative
          </button>
          <button
            type="button"
            onClick={() => quickRebalance('balanced')}
            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200"
          >
            Balanced
          </button>
          <button
            type="button"
            onClick={() => quickRebalance('aggressive')}
            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
          >
            Aggressive
          </button>
        </div>
      </div>

      <form onSubmit={handleRebalance} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Allocations
          </label>
          <div className="space-y-3">
            {allocations.map((allocation, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900 w-16">{allocation.asset}</span>
                <input
                  type="number"
                  value={allocation.target}
                  onChange={(e) => handleAllocationChange(index, parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500 w-8">%</span>
                <span className="text-xs text-gray-400 w-12">
                  ({allocation.current}%)
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-sm">
            <span className={`font-medium ${getTotalAllocation() === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {getTotalAllocation()}%
            </span>
            {getTotalAllocation() !== 100 && (
              <span className="text-red-600 ml-2">(Must equal 100%)</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || getTotalAllocation() !== 100}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Rebalancing...' : 'Rebalance Vault'}
        </button>
      </form>

      {txHash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <span className="font-medium">Rebalance successful!</span>
          </p>
          <p className="text-xs text-green-600 mt-1">
            Hash: {txHash}
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>• Rebalancing may incur gas fees</p>
        <p>• Slippage may affect execution</p>
        <p>• Process may take several minutes</p>
      </div>
    </div>
  )
} 