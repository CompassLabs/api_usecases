import dotenv from "dotenv";

dotenv.config();
const SENDER = "0xEbDdDBafC3Fc3742fe2a3CFec17A20a50E84d598";

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
  AaveSupplyParams,
  BatchedUserOperationsRequest,
  MulticallExecuteRequest,
  SignedAuthorization,
  MulticallActionType,
    Chain,
    MulticallAuthorizationRequest,
  UserOperation
} from "@compass-labs/api-sdk/models/components";
import { TokenPriceToken, TokenPriceChain, TokenPriceRequest } from "@compass-labs/api-sdk/models/operations/tokenprice"

const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY!,
});



const request0: MulticallAuthorizationRequest = {
  chain: Chain.EthereumMainnet,
  sender: SENDER

}
const result0 = await compassApiSDK.transactionBatching.authorization(request0)
console.log(result0);


// // Multicall request
// const request1: MulticallExecuteRequest = {
//   chain: Chain.EthereumMainnet,
//   sender: "0x0",
//   signedAuthorization: {
//     nonce: 1000,
//     address: "0xcA11bde05977b3631167028862bE2a173976CA11",
//     chainId: 42161,
//     r: 1111,
//     s: 2222,
//     yParity: 0,
//   } as SignedAuthorization,
//   actions: [
//   {
//     actionType: MulticallActionType.AaveSupply,
//     body: {
//       token: "USDC",
//       amount: 1
//     } as AaveSupplyParams
//   } as UserOperation
//   ]
//   ,
// };
// const result1 = await compassApiSDK.transactionBatching.execute(request1)
// console.log(result1);
