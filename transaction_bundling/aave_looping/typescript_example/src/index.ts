// SNIPPET START 1
import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains';
import { http, SendTransactionRequest } from 'viem';

import { createWalletClient } from 'viem';

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string;

// SNIPPET END 1

// SNIPPET START 2
const main = async () => {
    const compassApiSDK = new CompassApiSDK({
        apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    const account = privateKeyToAccount(PRIVATE_KEY);

    const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(RPC_URL as string),
    });

    // SNIPPET END 2

    // SNIPPET START 3
    const auth = await compassApiSDK.transactionBatching.authorization({
        chain: "ethereum:mainnet",
        sender: account.address,
    });

    const signedAuth = await walletClient.signAuthorization({
        account,
        contractAddress: auth.address as `0x${string}`,
    });

    // SNIPPET END 3

    // SNIPPET START 4
    const loopingTx = await compassApiSDK.transactionBatching.aaveLoop({
        chain: "ethereum:mainnet",
        sender: account.address,
        signedAuthorization: {
            nonce: signedAuth.nonce,
            address: signedAuth.address,
            chainId: signedAuth.chainId,
            r: signedAuth.r,
            s: signedAuth.s,
            yParity: signedAuth.yParity as number,
        },
        collateralToken: "USDC",
        borrowToken: "WETH",
        initialCollateralAmount: 5,
        multiplier: 1.5,
        maxSlippagePercent: 2.5,
        loanToValue: 70,
    });

    // SNIPPET END 4

    // SNIPPET START 5
    const tx = await walletClient.sendTransaction(loopingTx as unknown as SendTransactionRequest);

    console.log(tx);

    // SNIPPET END 5
}


main();