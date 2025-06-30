import { MorphoUserPositionRequest } from '@compass-labs/api-sdk/models/operations';
import { VaultPosition } from '@compass-labs/api-sdk/models/components';

export const getUserPositions = async (
    compassApiSDK: any,
    setVaultPositions: (positions: VaultPosition[]) => void,
    address: string
) => {
    console.log('Getting user positions for address', address);
    const userPositions = await compassApiSDK.morpho.userPosition({
        chain: 'base:mainnet',
        userAddress: address,
    } as MorphoUserPositionRequest);

    setVaultPositions(userPositions.vaultPositions);
};
