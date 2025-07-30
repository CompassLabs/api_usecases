import { CompassApiSDK } from '@compass-labs/api-sdk';
import type { VaultForTracking } from './addVaultForTracking';

export const deposit = async (
  compassApiSDK: CompassApiSDK,
  vault: VaultForTracking,
  amount: number,
  walletAddress: string,
  setTransactionStatus: (status: string) => void,
) => {
  try {
    setTransactionStatus('Preparing deposit transaction...');
    
    // Get deposit calldata from Compass API
    const response = await compassApiSDK.smartAccount.accountBatchedUserOperations({
      sender: walletAddress,
      chain: "base:mainnet",
      operations: [
        {
            body: {
                actionType: "SET_ALLOWANCE",
                token: "USDC",
                contract: vault.address,
                amount: amount,
            }
        },
        {
          body: {
            actionType: "MORPHO_DEPOSIT",
            vaultAddress: vault.address,
            amount: amount,
          }
        }
      ]
    });

    setTransactionStatus('Deposit transaction prepared successfully!');
    return response;
  } catch (error: any) {
    console.error('Failed to prepare deposit:', error);
    setTransactionStatus('Failed to prepare deposit: ' + (error?.message || error));
    throw error;
  }
};