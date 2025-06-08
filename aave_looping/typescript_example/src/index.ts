import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains';
import { http, SendTransactionRequest } from 'viem';

import { createWalletClient } from 'viem';

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const RPC_URL = process.env.RPC_URL as string;

const main = async () => {
    const compassApiSDK = new CompassApiSDK({
        apiKeyAuth: process.env.COMPASS_API_KEY,
    });

    const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

    const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(RPC_URL as string),
    });

    const auth = await compassApiSDK.transactionBatching.authorization({
        chain: "ethereum:mainnet",
        sender: account.address,
    });

    const signedAuth = await walletClient.signAuthorization({
        account,
        address: auth.address as `0x${string}`,
    });

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
        initialCollateralAmount: 10,
        multiplier: 2.0,
        maxSlippagePercent: 1,
        loanToValue: 80,
    });

    const tx = await walletClient.sendTransaction(loopingTx as unknown as SendTransactionRequest);

    console.log(tx);
}


main();