import { useState, useEffect } from 'react'
import { CompassApiSDK } from '@compass-labs/api-sdk'

interface Vault {
  id: string
  name?: string
  address: string
  chainId?: number
  protocol?: string
  apy?: number
  token?: string
}

export function useVaults() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVaults = async () => {
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

        const morphoResult = await compassApiSDK.morpho.morphoVaults({})
        
        const transformedVaults: Vault[] = (morphoResult.vaults?.map((vault: any) => ({
          id: vault.id || vault.address,
          name: vault.name || `Vault ${vault.address.slice(0, 6)}...${vault.address.slice(-4)}`,
          address: vault.address,
          chainId: vault.chainId,
          protocol: 'Morpho',
          apy: vault.state.apy,
          token: vault.asset.address
        })) || [])

        const sortedVaults = transformedVaults.sort((a, b) => {
          const apyA = a.apy || 0
          const apyB = b.apy || 0
          return apyB - apyA
        })

        setVaults(sortedVaults)
      } catch (err) {
        console.error('Failed to load vaults:', err)
        setError(err instanceof Error ? err.message : 'Failed to load vaults')
      } finally {
        setIsLoading(false)
      }
    }

    loadVaults()
  }, [])

  const refreshVaults = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_COMPASS_API_KEY
      if (!apiKey) {
        throw new Error('COMPASS_API_KEY not found in environment variables')
      }

      const compassApiSDK = new CompassApiSDK({
        apiKeyAuth: apiKey,
      })

      const morphoResult = await compassApiSDK.morpho.morphoVaults({})
      
      const transformedVaults: Vault[] = (morphoResult.vaults?.map((vault: any) => ({
        id: vault.id || vault.address,
        name: vault.name || `Vault ${vault.address.slice(0, 6)}...${vault.address.slice(-4)}`,
        address: vault.address,
        chainId: vault.chainId,
        protocol: 'Morpho',
        apy: vault.state.apy,
        token: vault.token || vault.asset || 'USDC'
      })) || [])

      const sortedVaults = transformedVaults.sort((a, b) => {
        const apyA = a.apy || 0
        const apyB = b.apy || 0
        return apyB - apyA
      })

      setVaults(sortedVaults)
    } catch (err) {
      console.error('Failed to refresh vaults:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh vaults')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    vaults,
    isLoading,
    error,
    refreshVaults
  }
} 