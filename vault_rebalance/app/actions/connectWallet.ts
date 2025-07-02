import { getAddress } from 'viem';
// import { getUserPositions } from './getUserPositions';
import { VaultPosition } from '@compass-labs/api-sdk/models/components';

export const connectWallet = async (setLoading: (loading: boolean) => void, setWalletAddress: (address: string) => void, setIsConnected: (connected: boolean) => void, setVaultPositions: (positions: VaultPosition[]) => void, compassApiSDK: any)  => {
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