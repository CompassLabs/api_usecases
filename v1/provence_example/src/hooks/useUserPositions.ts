import { useState, useEffect } from 'react'
import { useMetaMask } from '@/contexts/MetaMaskContext'
import { getCompassSDK } from '@/utils/compass'

interface VaultPosition {
  id: string
  state: {
    pnlUsd: string
    assets: string
    assetsUsd: string
    shares: string
  }
  vault: {
    address: string
    name: string
    symbol: string
    whitelisted: boolean
    asset: {
      name: string
      symbol: string
      address: string
      decimals: number
      priceUsd: string
      logoURI: string
    }
    dailyApys: {
      apy: string
      netApy: string
    }
    weeklyApys: {
      apy: string
      netApy: string
    }
    monthlyApys: {
      apy: string
      netApy: string
    }
  }
}

interface MarketPosition {
  market: {
    uniqueKey: string
  }
  healthFactor: string
  priceVariationToLiquidationPrice: string
  state: {
    pnlUsd: string
    borrowAssets: string
    borrowShares: string
    borrowAssetsUsd: string
    collateral: string
    collateralUsd: string
    supplyAssets: string
    supplyShares: string
    supplyAssetsUsd: string
  }
}

interface UserPositionState {
  vaultsPnlUsd: string
  vaultsAssetsUsd: string
  marketsPnlUsd: string
  marketsBorrowAssetsUsd: string
  marketsCollateralUsd: string
  marketsSupplyAssetsUsd: string
}

interface UserPositions {
  state: UserPositionState
  vaultPositions: VaultPosition[]
  marketPositions: MarketPosition[]
}

export function useUserPositions() {
  const { wallet } = useMetaMask()
  const [positions, setPositions] = useState<UserPositions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = async () => {
    if (!wallet?.address) {
      setPositions(null)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const compassApiSDK = getCompassSDK()

      const userAddress = wallet.address as string
      const result = await compassApiSDK.morpho.morphoUserPosition({
        chain: 'base' as any,
        userAddress: userAddress
      })
      
      setPositions(result as UserPositions)
    } catch (err) {
      console.error('Failed to load user positions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load user positions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [wallet?.address])

  const refreshPositions = () => {
    fetchPositions()
  }

  return {
    positions,
    isLoading,
    error,
    refreshPositions,
    hasWallet: !!wallet?.address
  }
}