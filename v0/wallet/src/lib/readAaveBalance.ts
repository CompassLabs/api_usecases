'use server';

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
    Chain,
    TokenEnum,
} from "@compass-labs/api-sdk/models/components";
import {AaveUserPositionPerTokenRequest} from "@compass-labs/api-sdk/models/operations";

// Normally you'd load this once globally; keeping it here for now
const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!,  // <-- Use NEXT_PUBLIC_ for frontend compatibility
});

export async function getAaveTokenBalance(token: TokenEnum, owner: string): Promise<string> {

    const request: AaveUserPositionPerTokenRequest = {
        chain: Chain.EthereumMainnet,
        user: owner,
        token: token
    }
    return (await compassApiSDK.aaveV3.userPositionPerToken(request)).tokenBalance
}

