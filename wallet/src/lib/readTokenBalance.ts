'use server';

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
    Chain,
    TokenEnum,
} from "@compass-labs/api-sdk/models/components";
import {TokenBalanceRequest} from "@compass-labs/api-sdk/models/operations";

// Normally you'd load this once globally; keeping it here for now
const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!,  // <-- Use NEXT_PUBLIC_ for frontend compatibility
});

export async function getTokenBalance(token: TokenEnum, owner: string): Promise<number> {

    console.log("Owner", owner);

    const request0: TokenBalanceRequest = {
        chain: Chain.EthereumMainnet,
        user: owner,
        token: token
    }
    const result0 = await compassApiSDK.token.balance(request0)

    // You can return whatever part of result you want here
    return Number(result0.amount);
}

