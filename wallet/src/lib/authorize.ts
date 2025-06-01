'use server';

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
    Chain,
    MulticallAuthorizationRequest
} from "@compass-labs/api-sdk/models/components";

// Normally you'd load this once globally; keeping it here for now
const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!,  // <-- Use NEXT_PUBLIC_ for frontend compatibility
});

export async function authorize(sender: string): Promise<any> {

    const request0: MulticallAuthorizationRequest = {
        chain: Chain.EthereumMainnet,
        sender: sender
    }
    const result0 = await compassApiSDK.transactionBatching.authorization(request0)
    console.log(result0);


    // You can return whatever part of result you want here
    return result0;
}


export type SignedAuthorization = {
    nonce: number;
    address: string;
    chainId: number;
    r: string;
    s: string;
    yParity: number;
};

export async function parseSignature(
    signature: string,
    nonce: number,
    address: string,
    chainId: number
): Promise<SignedAuthorization> {
    // Remove 0x
    const sig = signature.startsWith("0x") ? signature.slice(2) : signature;

    const r = "0x" + sig.slice(0, 64);
    const s = "0x" + sig.slice(64, 128);
    let v = parseInt(sig.slice(128, 130), 16);

    // Normalize yParity to 0 or 1
    if (v >= 27) {
        v = v - 27;
    }

    return {
        nonce,
        address,
        chainId,
        r,
        s,
        yParity: v,
    };
}
