import { config } from "dotenv";

// Load environment variables first
config();

import { FireblocksWeb3Provider, ChainId, ApiBaseUrl, type FireblocksProviderConfig } from "@fireblocks/fireblocks-web3-provider";
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import {
    createKernelAccount,
    createKernelAccountClient,
    createZeroDevPaymasterClient,
  } from '@zerodev/sdk';
import { type Signer } from '@zerodev/sdk/types/utils';
import { ethers } from 'ethers';

const ZERODEV_RPC = process.env.ZERODEV_RPC;
const RPC_URL = process.env.RPC_URL;

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

    const erc20_abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
    ];

    const tokenAddress = ethers.getAddress("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"); // Example: UNI token on Sepolia
    const spenderAddress = accountAddress; // Example spender address
    const allowanceAmount = "1000000000000000000"; // 1 token (assuming 18 decimals)

    const erc20Interface = new ethers.Interface(erc20_abi);
    
    const encodedApproveData = erc20Interface.encodeFunctionData("approve", [
        spenderAddress, 
        allowanceAmount
    ]);

    console.log("📝 Encoded approve transaction data:", encodedApproveData);

    const operations = [{
        to: tokenAddress as `0x${string}`,
        data: encodedApproveData as `0x${string}`,
        value: BigInt(0)
    }];

    try {
        const operationHash = await kernelClient.sendUserOperation({
          callData: await kernelClient.account.encodeCalls(operations),
        });
        console.log('Submitted batched transaction:', operationHash);
        const operationReceipt = await kernelClient.waitForUserOperationReceipt({
          hash: operationHash,
        });
        console.log('Batched transaction confirmed:', operationReceipt.receipt.transactionHash);
    } catch (error) {
        console.error('An error occurred while processing the batched transaction:', error);
    }
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