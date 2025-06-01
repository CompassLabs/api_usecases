'use server';

import { CompassApiSDK } from "@compass-labs/api-sdk";
import {
  AaveSupplyParams,
  TokenTransferErc20Params,
  TokenEnum,
  TokenTransferRequest,
  BatchedUserOperationsRequest,
  UserOperation,
  MulticallExecuteRequest,
  IncreaseAllowanceParams,
  IncreaseAllowanceParamsContractName
} from "@compass-labs/api-sdk/models/components";
import { TokenPriceChain } from "@compass-labs/api-sdk/models/operations/tokenprice";

// Normally you'd load this once globally; keeping it here for now
const compassApiSDK = new CompassApiSDK({
  apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!,  // <-- Use NEXT_PUBLIC_ for frontend compatibility
});

// Type for the external API response
export type SupplyApiResponse = {
  tx: {
    to: string;
    value: string;
    data: string;
    gas?: string;
  };
};

export async function requestSupplyTransaction(
  amount: number,
  token: TokenEnum,
  sender: string,
  signed_authorization: any
): Promise<any> {

  const fee: number = 0.01;

  const amount_supply: number = amount * (1 - fee);
  const amount_fee: number = amount - amount_supply;


  const request: MulticallExecuteRequest = {
    chain: TokenPriceChain.EthereumMainnet,
    sender: sender,
    signedAuthorization: signed_authorization,
    actions: [
      {
        body: {
          actionType: 'ALLOWANCE_INCREASE',
          token: token,
          amount: amount_supply,
          contractName: IncreaseAllowanceParamsContractName.AaveV3Pool
        } as IncreaseAllowanceParams
      } as UserOperation,
      {
        body: {
          actionType: 'AAVE_SUPPLY',
          token: token,
          amount: amount_supply
        } as AaveSupplyParams
      } as UserOperation,
      {
        body: {
          actionType: 'TOKEN_TRANSFER_ERC20',
          token: token,
          amount: amount_fee,
          to: "0xa829B388A3DF7f581cE957a95edbe419dd146d1B",
        } as TokenTransferErc20Params
      } as UserOperation,
    ],
  };

  const result = await compassApiSDK.transactionBatching.execute(request);

  console.log(result);


  // You can return whatever part of result you want here
  return result;
}
