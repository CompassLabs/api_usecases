'use server';

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
    Chain,
    TokenEnum,
} from "@compass-labs/api-sdk/models/components";
import { AaveRateRequest, AaveAvgRateRequest } from "@compass-labs/api-sdk/models/operations";


const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!,  // <-- Use NEXT_PUBLIC_ for frontend compatibility
});


export async function getAaveRates(token: TokenEnum): Promise<string> {
    const request0: AaveRateRequest = {
        chain: Chain.EthereumMainnet,
        token: token
    }
    return (await compassApiSDK.aaveV3.rate(request0)).supplyApyVariableRate;

}


export async function getAave30dRates(token: TokenEnum): Promise<number> {
    const request0: AaveAvgRateRequest = {
        chain: Chain.EthereumMainnet,
        token: token,
        days: 30
    }
    return (await compassApiSDK.aaveV3.avgRate(request0)).supplyApyVariableRate
}