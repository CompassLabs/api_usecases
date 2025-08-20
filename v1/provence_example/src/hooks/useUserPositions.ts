import { useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { CompassApiSDK } from '@compass-labs/api-sdk'

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
  const { user, primaryWallet } = useDynamicContext()
  const [positions, setPositions] = useState<UserPositions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = async () => {
    if (!user || !primaryWallet?.address) {
      setPositions(null)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const apiKey = process.env.NEXT_PUBLIC_COMPASS_API_KEY
      if (!apiKey) {
        throw new Error('COMPASS_API_KEY not found in environment variables')
      }

      const compassApiSDK = new CompassApiSDK({
        apiKeyAuth: apiKey,
      })

      const userAddress = primaryWallet.address as string
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
  }, [user, primaryWallet?.address])

  const refreshPositions = () => {
    fetchPositions()
  }

  return {
    positions,
    isLoading,
    error,
    refreshPositions,
    hasWallet: !!(user && primaryWallet?.address)
  }
}