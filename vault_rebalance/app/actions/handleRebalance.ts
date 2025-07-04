import { SetAllowanceParams, UserOperation, MorphoDepositParams, MorphoWithdrawParams, VaultGetVaultResponse } from '@compass-labs/api-sdk/models/components';
import { toBeHex } from 'ethers';
import { VaultForTracking } from './addVaultForTracking';

export const handleRebalance = async ({
    compassApiSDK,
    vaultPositions,
    vaultTargetAllocations,
    walletAddress,
    setTransactionStatus,
}: {
    compassApiSDK: any,
    vaultPositions: VaultForTracking[],
    vaultTargetAllocations: { [key: string]: string },
    walletAddress: string,
    setTransactionStatus: (status: string) => void,
}) => {
    let vault_actions: UserOperation[] = [];
    let totalAmount = 0;
    for (const vault of vaultPositions) {
        const amountBefore = Number(vault.userPosition?.tokenAmount) / 10 ** vault.asset.decimals;
        totalAmount += Number(amountBefore);
    }
    for (const vault of vaultPositions) {
        vault_actions.push({
            body: {
                actionType: 'SET_ALLOWANCE',
                token: vault.asset.address,
                contract: vault.address,
                amount: totalAmount * 10,
            } as SetAllowanceParams,
        } as UserOperation);
    }
    let totalRebalanceAmount = 0;
    for (const vault of vaultPositions) {
        const vaultAddress = vault.address;
        vault_actions.push({
            body: {
                actionType: 'MORPHO_WITHDRAW',
                vaultAddress: vaultAddress,
                amount: 'ALL',
            } as MorphoWithdrawParams,
        } as UserOperation);
        const usdPrice = await compassApiSDK.token.price({ token: vault.asset.symbol as any, chain: "base:mainnet" });
        const rebalanceAmount = Number(vaultTargetAllocations[vaultAddress]) * Number(usdPrice);
        if (rebalanceAmount > 0) {
            vault_actions.push({
                body: {
                    actionType: 'MORPHO_DEPOSIT',
                    vaultAddress: vaultAddress,
                    amount: rebalanceAmount,
                } as MorphoDepositParams,
            } as UserOperation);
        }
        totalRebalanceAmount += rebalanceAmount;
    }
    if (totalRebalanceAmount > totalAmount) {
        alert('Total rebalance amount is greater than total amount');
        return;
    }
    const auth = await compassApiSDK.transactionBundler.bundlerAuthorization({
        chain: 'base:mainnet',
        sender: walletAddress,
    });
    const message = `Sign this message to authorize the transaction bundler.\n\nContract: ${auth.address}\nNonce: ${auth.nonce}`;
    const signature = await window.ethereum?.request({
        method: 'personal_sign',
        params: [message, walletAddress],
    });
    const r = signature.slice(0, 66);
    const s = '0x' + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);
    const yParity = v === 27 ? 0 : 1;
    const bundleTx = await compassApiSDK.transactionBundler.bundlerExecute({
        chain: 'base:mainnet',
        sender: walletAddress,
        actions: vault_actions,
        signedAuthorization: {
            nonce: auth.nonce,
            address: auth.address,
            chainId: auth.chainId,
            r: r,
            s: s,
            yParity: yParity,
        },
    });
    if (typeof window.ethereum !== 'undefined') {
        try {
            const modifiedAuthorizationList = bundleTx.authorizationList?.map((authObj: any) => ({
                ...authObj,
                v: v
            })) || [];
            const txParams = {
                from: walletAddress,
                to: bundleTx.to,
                value: toBeHex(bundleTx.value),
                data: bundleTx.data,
                gas: toBeHex(bundleTx.gas),
                authorizationList: modifiedAuthorizationList,
                nonce: toBeHex(bundleTx.nonce),
            };
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams],
            });
            setTransactionStatus(`Transaction submitted! Hash: ${txHash}`);
        } catch (error) {
            console.error('Transaction failed:', error);
            setTransactionStatus('Transaction failed. Please try again.');
        }
    } else {
        console.error('MetaMask not found');
        setTransactionStatus('MetaMask not found. Please install MetaMask.');
    }
}; 