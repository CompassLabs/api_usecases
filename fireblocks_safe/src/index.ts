import { config } from "dotenv";

// Load environment variables first
config();

import { FireblocksWeb3Provider, ChainId, ApiBaseUrl, type FireblocksProviderConfig } from "@fireblocks/fireblocks-web3-provider";
import { ethers } from 'ethers';
import { createSafeClient } from '@safe-global/sdk-starter-kit';


async function main(): Promise<void> {
  try {
    const config: FireblocksProviderConfig = {
        apiBaseUrl: ApiBaseUrl.Sandbox,
        privateKey: process.env.FIREBLOCKS_PRIVATE_KEY_PATH as string,
        apiKey: process.env.FIREBLOCKS_API_KEY as string,
        chainId: ChainId.SEPOLIA,
      };
    const eip1193Provider = new FireblocksWeb3Provider(config);

    const safeClient = await createSafeClient({
      provider: eip1193Provider,
      safeOptions: {
          owners: ["0x79D154A7493F4d535582D5e177CE36e0a7a6C71a"],
          threshold: 1,
      },
    });

    const erc20_abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
    ];

    const tokenAddress = ethers.getAddress("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"); // Example: UNI token on Sepolia
    const spenderAddress = "0x79D154A7493F4d535582D5e177CE36e0a7a6C71a"; // Example spender address
    const allowanceAmount = "1000000000000000000"; // 1 token (assuming 18 decimals)

    const erc20Interface = new ethers.Interface(erc20_abi);
    
    const encodedApproveData = erc20Interface.encodeFunctionData("approve", [
        spenderAddress, 
        allowanceAmount
    ]);
    const operations = [{
        to: tokenAddress as `0x${string}`,
        data: encodedApproveData as `0x${string}`,
        value: '0'
    }];

    try {
        const operationHash = await safeClient.send({transactions: operations});
        console.log('Submitted batched transaction:', operationHash);
        console.log('txResult.status', operationHash.status);
        console.log(operationHash.transactions?.ethereumTxHash);
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