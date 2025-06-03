import { createSafeClient } from '@safe-global/sdk-starter-kit';
import dotenv from 'dotenv';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { SafeProvider } from '@safe-global/protocol-kit';

dotenv.config();

const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL as SafeProvider['provider'];
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as string;
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS as string;
const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS as string;

const main = async () => {
    // NOTE: if creating a new safe client, we need to use this
    let safeClient;

    // if (SAFE_ADDRESS === undefined) {
    safeClient = await createSafeClient({
        provider: ARBITRUM_RPC_URL,
        signer: SIGNER_PRIVATE_KEY,
        safeOptions: {
            owners: [SIGNER_ADDRESS],
            threshold: 1,
        },
    });
    // } else {
    // // Else, we can use the existing safe client
    //     safeClient = await createSafeClient({
    //         provider: ARBITRUM_RPC_URL,
    //         signer: SIGNER_PRIVATE_KEY,
    //         safeAddress: SAFE_ADDRESS,
    //     });
    // }
    console.log('Safe client created at:', await safeClient.getAddress());
    console.log('is Safe client deployed:', await safeClient.isDeployed());

    const compassApiSDK = new CompassApiSDK({
        apiKeyAuth: COMPASS_API_KEY,
    });

    const result = await compassApiSDK.smartAccount.accountBatchedUserOperations({
        chain: 'arbitrum:mainnet',
        operations: [
            {
                body: {
                    actionType: 'ALLOWANCE_INCREASE',
                    token: 'USDC',
                    contractName: 'AaveV3Pool',
                    amount: '10',
                },
            },
            {
                body: {
                    actionType: 'AAVE_SUPPLY',
                    token: 'USDC',
                    amount: '10',
                },
            },
        ],
    });

    const operations = result.operations.map((op) => ({
        to: op.to as `0x${string}`,
        data: op.data as `0x${string}`,
        value: op.value ? String(op.value) : '0',
    }));

    const txResult = await safeClient.send({ transactions: operations });

    // NOTE: if there is more than one signer, we need to create a new safe client for each signer
    // const safeTxHash = txResult.transactions?.safeTxHash
    // const newSafeClient = await createSafeClient({
    //     provider: RPC_URL,
    //     signer: OTHER_SIGNER_PRIVATE_KEY,
    //     safeAddress: safeTxHash,
    // });
    // const pendingTransactions = await newSafeClient.getPendingTransactions()
    // for (const transaction of pendingTransactions.results) {
    //     if (transaction.safeTxHash !== safeTxHash) {
    //       return
    //     }

    // const txResult2 = await newSafeClient.confirm({safeTxHash});

    console.log('txResult', txResult);
    console.log('txResult.status', txResult.status);
    console.log(txResult.transactions?.ethereumTxHash);
};

main();
