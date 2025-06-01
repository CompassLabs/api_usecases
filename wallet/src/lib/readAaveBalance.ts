'use server';

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
    Chain,
    TokenEnum,
} from "@compass-labs/api-sdk/models/components";
import {AaveUserPositionPerTokenRequest} from "@compass-labs/api-sdk/models/operations";
import { Token } from "@compass-labs/api-sdk/sdk/token.js";

// Normally you'd load this once globally; keeping it here for now
const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!,  // <-- Use NEXT_PUBLIC_ for frontend compatibility
});

export async function getAaveTokenBalance(token: TokenEnum, owner: string): Promise<string> {

    console.log("Owner", owner);

    const request0: AaveUserPositionPerTokenRequest = {
        chain: Chain.EthereumMainnet,
        user: owner,
        token: token
    }
    const result0 = await compassApiSDK.aaveV3.userPositionPerToken(request0)
    console.log("balance", result0);


    // You can return whatever part of result you want here
    return result0.tokenBalance;
}

