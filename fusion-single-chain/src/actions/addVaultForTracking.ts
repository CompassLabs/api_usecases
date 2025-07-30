import { CompassApiSDK } from '@compass-labs/api-sdk';
import type { VaultGetVaultResponse } from '@compass-labs/api-sdk/models/components';

export type VaultForTracking = VaultGetVaultResponse & {
  address: string;
};

export const addVaultForTracking = async (
  compassApiSDK: CompassApiSDK,
  setVaults: (vaults: VaultForTracking[]) => void,
  vaults: VaultForTracking[],
  vaultAddress: string,
  walletAddress: string,
) => {
  try {
    // Check if vault is already being tracked
    if (vaults.some(vault => vault.address.toLowerCase() === vaultAddress.toLowerCase())) {
      return;
    }
    
    // Fetch vault details
    const response = await compassApiSDK.erc4626Vaults.vault({
      vaultAddress: vaultAddress,
      chain: "base:mainnet",
      userAddress: walletAddress,
    });

    const newVault: VaultForTracking = {
      ...response,
      address: vaultAddress,
    };

    // Add to existing vaults
    setVaults([...vaults, newVault]);
  } catch (error: any) {
    console.error('Failed to add vault for tracking:', error);
  }
};