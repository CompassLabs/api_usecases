'use server';

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
    Chain,
    TokenEnum,
} from "@compass-labs/api-sdk/models/components";
import {AaveRateRequest, AaveAvgRateRequest} from "@compass-labs/api-sdk/models/operations";
import { Token } from "@compass-labs/api-sdk/sdk/token.js";

// Normally you'd load this once globally; keeping it here for now
const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!,  // <-- Use NEXT_PUBLIC_ for frontend compatibility
});

export async function getAaveRates(token: TokenEnum): Promise<string> {
    const request0: AaveRateRequest = {
        chain: Chain.EthereumMainnet,
        token: token
    }
    const result0 = await compassApiSDK.aaveV3.rate(request0)

    // You can return whatever part of result you want here
    return result0.supplyApyVariableRate;
}



export async function getAave30dRates(token: TokenEnum): Promise<number> {
    const request0: AaveAvgRateRequest = {
        chain: Chain.EthereumMainnet,
        token: token,
        days: 7
    }
    const result0 = await compassApiSDK.aaveV3.avgRate(request0)
    console.log("Average rate", result0);

    // You can return whatever part of result you want here
    return result0.supplyApyVariableRate;
}