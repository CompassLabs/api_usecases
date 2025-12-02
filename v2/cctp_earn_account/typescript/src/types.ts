import { CompassApiSDK } from "@compass-labs/api-sdk";

export interface ChainClients {
  userWallet: any;
  sponsorWallet: any;
  publicClient: any;
}

export interface BridgeContext {
  compass: CompassApiSDK;
  ownerAddress: `0x${string}`;
  sponsorAddress: `0x${string}`;
  base: ChainClients;
  arbitrum: ChainClients;
}

export interface BurnResult {
  bridgeId: string;
  burnTxHash: `0x${string}`;
}

export interface AttestationResult {
  mintResponse: any;
  alreadyCompleted: boolean;
}

export interface EarnAccountsResult {
  baseAddress: string;
  arbitrumAddress: string;
}
