

import { CompassApiSDK } from "@compass-labs/api-sdk";
import { smartAccountAccountBatchedUserOperations } from "@compass-labs/api-sdk/funcs/smartAccountAccountBatchedUserOperations.js";
import { AaveSupplyParams, BatchedUserOperationsRequest, IncreaseAllowanceParams, IncreaseAllowanceParamsContractName, MulticallActionType, UserOperation } from "@compass-labs/api-sdk/models/components";
import { TokenPriceToken, TokenPriceChain, TokenPriceRequest } from "@compass-labs/api-sdk/models/operations/tokenprice"
import { SmartAccount } from "@compass-labs/api-sdk/sdk/smartaccount.js";


// Token Price //
const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: "DO NOT COMMIT KEY",
});
const request: TokenPriceRequest = {
  chain: TokenPriceChain.EthereumMainnet,
  token: TokenPriceToken.Usdc,
};
const result = await compassApiSDK.token.price(request)
console.log(result);



// SmartAccount
const request1: BatchedUserOperationsRequest = {
  chain: TokenPriceChain.EthereumMainnet,
  operations: [{
    actionType: MulticallActionType.AaveSupply,
    body: {
      token: "USDC",
      amount: 1
    } as AaveSupplyParams
  } as UserOperation,
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
