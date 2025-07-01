import { SetAllowanceParams, UserOperation, MorphoDepositParams } from '@compass-labs/api-sdk/models/components';
import { toBeHex } from 'ethers';

export const deposit = async ({
    compassApiSDK,
    vaultAddress,
    amount,
    walletAddress,
    setTransactionStatus,
}: {
    compassApiSDK: any,
    vaultAddress: string,
    amount: string,
    walletAddress: string,
    setTransactionStatus: (status: string) => void,
}) => {
    let withdraw_actions: UserOperation[] = [];
   
    
    withdraw_actions.push({
        body: {
            actionType: 'SET_ALLOWANCE',
            token: "USDC", // TODO change this to the token resolution
            contract: vaultAddress,
            amount: amount,
        } as SetAllowanceParams,
    } as UserOperation);

    withdraw_actions.push({
        body: {
            actionType: 'MORPHO_DEPOSIT',
            vaultAddress: vaultAddress,
            amount: amount,
        } as MorphoDepositParams, 
    } as UserOperation);
    

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
        actions: withdraw_actions,
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