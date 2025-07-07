import { getAddress } from 'viem';
// import { getUserPositions } from './getUserPositions';
import { VaultPosition } from '@compass-labs/api-sdk/models/components';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { VaultForTracking } from './addVaultForTracking';

export const fetchVaults = async (
    compassApiSDK: CompassApiSDK, 
    setVaults: (vaults: VaultForTracking[]) => void,
    walletAddress: string
) => {
    try {
        // Get list of Morpho vaults
        const morphoResponse = await compassApiSDK.morpho.vaults({
            chain: "base:mainnet",
        });
        
        // Extract vaults array from response - the API likely returns { vaults: [...] }
        const vaultList = morphoResponse.vaults || [];
        console.log(vaultList)
        // // Make async calls to get detailed info for each vault
        const detailedVaults = await Promise.all(
            vaultList.map(async (vault: any) => {
                try {
                    const response = await compassApiSDK.erc4626Vaults.vault({
                        vaultAddress: vault.address,
                        chain: "base:mainnet",
                        userAddress: walletAddress,
                    });
                    if (response.userPosition && parseFloat(response.userPosition.tokenAmount.toString()) > 0) {
                        return { ...response, address: vault.address };
                    }
                    return null;
                } catch (error) {
                    console.error(`Failed to fetch vault ${vault.address}:`, error);
                    return null;
                }
            })
        );

        const validVaults = detailedVaults.filter((vault): vault is VaultForTracking => {
            if (vault === null) return false;
            return true;
        });
        
        setVaults(validVaults);
    } catch (error) {
        console.error('Failed to fetch vaults:', error);
        throw error;
    }
};

export const connectWallet = async (
    setLoading: (loading: boolean) => void, 
    setWalletAddress: (address: string) => void, 
    setIsConnected: (connected: boolean) => void, 
    setVaults: (vaults: VaultForTracking[]) => void, 
    compassApiSDK: any
) => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            console.log('Connecting wallet');
            setLoading(true);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('Accounts', accounts);
            const checksumAddress = getAddress(accounts[0]);
            console.log('Checksum address', checksumAddress);
            setWalletAddress(checksumAddress);
            console.log('Setting is connected to true');
            setIsConnected(true);
            
            // Switch to Base network
            // try {
            //     console.log('Switching to Base network');
            //     await window.ethereum.request({
            //         method: 'wallet_switchEthereumChain',
            //         params: [{ chainId: '0x2105' }], // Base mainnet chainId
            //     });
            //     console.log('Switched to Base network');
            // } catch (switchError: any) {
            //     // This error code indicates that the chain has not been added to MetaMask
            //     if (switchError.code === 4902) {
            //         try {
            //             await window.ethereum.request({
            //                 method: 'wallet_addEthereumChain',
            //                 params: [{
            //                     chainId: '0x2105',
            //                     chainName: 'Base',
            //                     nativeCurrency: {
            //                         name: 'ETH',
            //                         symbol: 'ETH',
            //                         decimals: 18
            //                     },
            //                     rpcUrls: ['https://mainnet.base.org'],
            //                     blockExplorerUrls: ['https://basescan.org']
            //                 }]
            //             });
            //             console.log('Added Base network');
            //         } catch (addError) {
            //             console.error('Failed to add Base network:', addError);
            //             throw new Error('Failed to add Base network to MetaMask');
            //         }
            //     } else {
            //         // Handle other switch errors (like user rejection)
            //         console.error('Failed to switch to Base network:', switchError);
            //         throw new Error('Failed to switch to Base network');
            //     }
            // }

            // Get user positions immediately after successful network switch
            // await getUserPositions(compassApiSDK, setVaultPositions, checksumAddress);

            // Fetch available vaults after wallet connection
            // try {
            //     await fetchVaults(compassApiSDK, setVaults, checksumAddress);
            //     console.log('Vaults fetched successfully after wallet connection');
            // } catch (error) {
            //     console.error('Failed to fetch vaults after connection:', error);
            //     // Don't throw here - wallet connection was successful even if vault fetching failed
            // }
            
            setLoading(false);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            setLoading(false);
            // Optionally show user-friendly error message
            alert('Failed to connect wallet. Please try again.');
        }
    } else {
        alert('Please install MetaMask to use this application');
    }
};