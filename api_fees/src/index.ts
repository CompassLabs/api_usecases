import dotenv from "dotenv";

dotenv.config();

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
  AaveSupplyParams,
  TokenEnum,
  BatchedUserOperationsRequest,
  UserOperation
} from "@compass-labs/api-sdk/models/components";
import { TokenPriceToken, TokenPriceChain, TokenPriceRequest } from "@compass-labs/api-sdk/models/operations/tokenprice"

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY!,
});


// SmartAccount
const request1: BatchedUserOperationsRequest = {
  chain: TokenPriceChain.EthereumMainnet,
  operations: [
  {
    body: {
      actionType: 'AAVE_SUPPLY',
      token: TokenEnum.Usdc,
      amount: 1
    } as AaveSupplyParams
  } as UserOperation
  ]
  ,
};
const result1 = await compassApiSDK.smartAccount.accountBatchedUserOperations(request1)
console.log(result1);
