import dotenv from "dotenv";

dotenv.config();

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
  AaveSupplyParams,
  BatchedUserOperationsRequest,
  MulticallActionType,
  UserOperation
} from "@compass-labs/api-sdk/models/components";
import { TokenPriceToken, TokenPriceChain, TokenPriceRequest } from "@compass-labs/api-sdk/models/operations/tokenprice"

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY!,
});


// Token Price //
const request: TokenPriceRequest = {
  chain: TokenPriceChain.EthereumMainnet,
  token: TokenPriceToken.Usdc,
};
const result = await compassApiSDK.token.price(request)
console.log(result);


// SmartAccount
const request1: BatchedUserOperationsRequest = {
  chain: TokenPriceChain.EthereumMainnet,
  operations: [
  {
    actionType: MulticallActionType.AaveSupply,
    body: {
      token: "USDC",
      amount: 1
    } as AaveSupplyParams
  } as UserOperation
  ]
  ,
};
const result1 = await compassApiSDK.smartAccount.accountBatchedUserOperations(request1)
console.log(result1);
