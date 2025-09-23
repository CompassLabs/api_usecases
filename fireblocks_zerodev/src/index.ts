import { config } from "dotenv";
import { FireblocksWeb3Provider, ChainId, ApiBaseUrl, type FireblocksProviderConfig } from "@fireblocks/fireblocks-web3-provider";
import { createPublicClient, http, createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import {
    createKernelAccount,
    createKernelAccountClient,
    createZeroDevPaymasterClient,
  } from '@zerodev/sdk';
import { type Signer } from '@zerodev/sdk/types/utils';

const ZERODEV_RPC = process.env.ZERODEV_RPC;
const RPC_URL = process.env.RPC_URL;

config();

const entryPoint = getEntryPoint('0.7');
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });


async function main(): Promise<void> {
  try {
    const config: FireblocksProviderConfig = {
        apiBaseUrl: ApiBaseUrl.Sandbox,
        privateKey: process.env.FIREBLOCKS_PRIVATE_KEY_PATH as string,
        apiKey: process.env.FIREBLOCKS_API_KEY as string,
        chainId: ChainId.SEPOLIA,
      };
    const eip1193Provider = new FireblocksWeb3Provider(config);

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: eip1193Provider as unknown as Signer,
        entryPoint: entryPoint,
        kernelVersion: KERNEL_V3_1
      });

    const account = await createKernelAccount(publicClient, {
        entryPoint,
        plugins: { sudo: ecdsaValidator },
        kernelVersion: KERNEL_V3_1,
    });

    const zerodevPaymaster = createZeroDevPaymasterClient({
        chain: sepolia,
        transport: http(ZERODEV_RPC),
    });

    const kernelClient = createKernelAccountClient({
        account,
        chain: sepolia,
        bundlerTransport: http(ZERODEV_RPC),
        paymaster: {
            getPaymasterData(userOperation) {
                return zerodevPaymaster.sponsorUserOperation({ userOperation });
            },
        },
    });

    const accountAddress = kernelClient.account.address;
    console.log('My account:', accountAddress);

    console.log("✅ ECDSA validator created successfully:", ecdsaValidator);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the main function using top-level await
try {
  await main();
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}

export { main };