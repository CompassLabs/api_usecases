// SNIPPET START 1
import { createSafeClient } from '@safe-global/sdk-starter-kit';
import dotenv from 'dotenv';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { SafeProvider } from '@safe-global/protocol-kit';

dotenv.config();

const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL as SafeProvider['provider'];
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as string;
// NOTE: if creating new safe, uncomment the `SIGNER_ADDRESS`
// const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS as string;
const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS as string;

// SNIPPET END 1

// SNIPPET START 2
const main = async () => {
  // NOTE: if we need to deploy a new safe, uncomment the following code
  // const safeClient = await createSafeClient({
  //     provider: ARBITRUM_RPC_URL,
  //     signer: SIGNER_PRIVATE_KEY,
  //     safeOptions: {
  //         owners: [SIGNER_ADDRESS],
  //         threshold: 1,
  //     },
  // });
  // ELSE: use existing safe client:
  const safeClient = await createSafeClient({
    provider: ARBITRUM_RPC_URL,
    signer: SIGNER_PRIVATE_KEY,
    safeAddress: SAFE_ADDRESS,
  });

  console.log('Safe client created at:', await safeClient.getAddress());

  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: COMPASS_API_KEY,
  });

  // SNIPPET END 2

  // SNIPPET START 3
  const result = await compassApiSDK.smartAccount.accountBatchedUserOperations({
    chain: 'arbitrum:mainnet',
    operations: [
      {
        body: {
          actionType: 'SET_ALLOWANCE',
          token: 'USDC',
          contract: 'AaveV3Pool',
          amount: '3',
        },
      },
      // NOTE: if creating new safe, comment the `AAVE_SUPPLY` operation out
      // the safe smart account will not have any USDC as it gets
      // deployed only with the first transaction
      // so the first transaction will be the set allowance upon creation
      // when reusing an existing contract, fund it with 10 USDC and uncomment this operation
      {
        body: {
          actionType: 'AAVE_SUPPLY',
          token: 'USDC',
          amount: '3',
        },
      },
    ],
  });

  const operations = result.operations.map((op) => ({
    to: op.to as `0x${string}`,
    data: op.data as `0x${string}`,
    value: op.value ? String(op.value) : '0',
  }));

  // SNIPPET END 3

  // SNIPPET START 4
  try {
    const txResult = await safeClient.send({transactions: operations});
      console.log('txResult', txResult);
    console.log('txResult.status', txResult.status);
    console.log(txResult.transactions?.ethereumTxHash);
  }
  catch (error) {
    console.error("Ran into an error:", error);
    console.log("Ran into expected error. Wallet not funded");
  }

  // SNIPPET END 4

};

main();
