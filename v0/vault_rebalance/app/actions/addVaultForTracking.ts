import { VaultGetVaultResponse } from '@compass-labs/api-sdk/models/components';

export type VaultForTracking = VaultGetVaultResponse & {
  address: string;
};

export const addVaultForTracking = async (
  compassApiSDK: any,
  setVaults: (vaults: VaultForTracking[]) => void,
  vaults: VaultForTracking[],
  vaultAddress: string,
  setTransactionStatus: (status: string) => void,
  walletAddress: string,
) => {
  try {
    setTransactionStatus('Fetching vault info...');
    const response = await compassApiSDK.erc4626Vaults.vault({
      vaultAddress: vaultAddress,
      chain: "base:mainnet",
      userAddress: walletAddress,
    });
    console.log(response)
    if (vaults.find((vault) => vault.address === vaultAddress)) {
      setTransactionStatus('Vault already added for tracking!');
      return;
    }
    setVaults([...vaults, { ...response, address: vaultAddress }]);
    setTransactionStatus('Vault added for tracking!');
  } catch (error: any) {
    console.log(error)
    setTransactionStatus('Failed to fetch vault: ' + (error?.message || error));
  }
};
