import { Call, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import { CompassApiSDK } from '@compass-labs/api-sdk';

import dotenv from 'dotenv';
dotenv.config();

const ZERODEV_RPC = process.env.ZERODEV_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const COMPASS_API_KEY = process.env.COMPASS_API_KEY;

if (!ZERODEV_RPC) {
  throw new Error('ZERODEV_RPC is not set');
}

const chain = arbitrum;
const publicClient = createPublicClient({
  transport: http(ZERODEV_RPC),
  chain,
});
const entryPoint = getEntryPoint('0.7');

const main = async () => {
  const signer = privateKeyToAccount(PRIVATE_KEY);

  console.log('My account:', signer);

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion: KERNEL_V3_1,
  });

  const account = await createKernelAccount(publicClient, {
    entryPoint,
    plugins: { sudo: ecdsaValidator },
    kernelVersion: KERNEL_V3_1,
  });

  const zerodevPaymaster = createZeroDevPaymasterClient({
    chain,
    transport: http(ZERODEV_RPC),
  });

  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(ZERODEV_RPC),
    paymaster: {
      getPaymasterData(userOperation) {
        return zerodevPaymaster.sponsorUserOperation({ userOperation });
      },
    },
  });

  const accountAddress = kernelClient.account.address;
  console.log('My account:', accountAddress);

  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: COMPASS_API_KEY,
  });

  const result = await compassApiSDK.smartAccount.accountBatchedUserOperations({
    chain: 'arbitrum:mainnet',
    operations: [
      {
        body: {
          actionType: 'ALLOWANCE_INCREASE',
          token: 'USDC',
          contractName: 'AaveV3Pool',
          amount: '10',
        },
      },
      {
        body: {
          actionType: 'AAVE_SUPPLY',
          token: 'USDC',
          amount: '10',
        },
      },
    ],
  });

  const operations = result.operations.map((op) => ({
    to: op.to as `0x${string}`,
    data: op.data as `0x${string}`,
    value: op.value ? BigInt(op.value) : undefined,
  })) as Call[];



  try {
    const operationHash = await kernelClient.sendUserOperation({
      callData: await kernelClient.account.encodeCalls(operations),
    });
    console.log('Submitted batched transaction:', operationHash);
    const operationReceipt = await kernelClient.waitForUserOperationReceipt({
      hash: operationHash,
    });
    console.log('Batched transaction confirmed:', operationReceipt.receipt.transactionHash);
  } catch {
    console.log("Returned expected error. Wallet not funded.");
  }

};

main();
