// test.ts (works as .js if you drop the types)

import dotenv from "dotenv";
dotenv.config();

console.log('----------------------------------------')

import { FireblocksWeb3Provider, ChainId, ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";
import { CompassApiSDK } from "@compass-labs/api-sdk";
import { ContractEnum as Contract } from "@compass-labs/api-sdk/models/operations";
import { ethers } from "ethers";

// --- basic hello ---
console.log("Hello from Node.js!");

// --- env / constants ---
const SECRET1 = process.env.SECRET1 as string;
console.log(SECRET1);

const FIREBLOCKS_API_PRIVATE_KEY_PATH = "./fireblocks_secret.key"; // or process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH
const FIREBLOCKS_API_KEY = "4c9228b4-78fe-486a-a1b4-079d2eaef421"; // or process.env.FIREBLOCKS_API_KEY
const FIREBLOCKS_VAULT_ACCOUNT_IDS = process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS as string;

console.log(FIREBLOCKS_API_PRIVATE_KEY_PATH);
console.log(FIREBLOCKS_API_KEY);
console.log(FIREBLOCKS_VAULT_ACCOUNT_IDS);
console.log(ChainId.SEPOLIA);
console.log(ApiBaseUrl.Sandbox);

// --- Fireblocks EIP-1193 provider ---
const eip1193Provider = new FireblocksWeb3Provider({
  apiBaseUrl: ApiBaseUrl.Sandbox,              // Sandbox workspace
  privateKey: FIREBLOCKS_API_PRIVATE_KEY_PATH, // path to PEM key file
  apiKey: FIREBLOCKS_API_KEY,
  vaultAccountIds: FIREBLOCKS_VAULT_ACCOUNT_IDS,
  chainId: ChainId.SEPOLIA,
});

// --- ethers v5 provider & signer ---
const provider = new ethers.providers.Web3Provider(eip1193Provider);
await provider.send("eth_requestAccounts", []); // ensure account is selected/available
const signer = provider.getSigner();
const walletAddress = await signer.getAddress();
const { chainId } = await provider.getNetwork();

console.log({ walletAddress, chainId: Number(chainId) });

// --- Compass SDK ---
const compass = new CompassApiSDK({
  apiKeyAuth: process.env.COMPASS_API_KEY,
  serverURL: process.env.SERVER_URL || undefined,
});
console.log("Compass SDK ready");

// --- 7702-style authorization signing (replace viem.signAuthorization) ---
// Adjust `domain.name` / `domain.version` to whatever your verifier expects.
// Some libs use { name: "Authorization", version: "1" }.
const unsignedAuth = {
  nonce: 12,
  address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  chainId: 11155111, // Sepolia
};

// EIP-712 types per EIP-7702 "Authorization"
const types = {
  Authorization: [
    { name: "contractAddress", type: "address" },
    { name: "chainId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
};

// Many implementations use this domain. If your backend (or viem) used a different domain
// (e.g., name "Authorize Contract"), mirror that exactly or the signature will fail to verify.
const domain = {
  name: "Authorization",
  version: "1",
  chainId: unsignedAuth.chainId,
};

const value = {
  contractAddress: unsignedAuth.address,
  chainId: unsignedAuth.chainId,
  nonce: unsignedAuth.nonce,
};

const signedAuth = await (signer as any)._signTypedData(domain, types, value);
console.log("signedAuth:", signedAuth);

// If you need to broadcast a tx with ethers instead of viem, do it with `signer.sendTransaction({...})`.
// Example placeholder:
// const tx = await signer.sendTransaction({ to: walletAddress, value: ethers.utils.parseEther("0.0001") });
// console.log("tx hash:", tx.hash); await tx.wait();


// --- After signedAuth ---

// after signedAuth:

const { r, s, v } = ethers.utils.splitSignature(signedAuth);
const yParity = v === 27 ? "0x0" : "0x1";

// Build a type: 0x04 tx with an authorizationList.
// Delegate is the contract you want your EOA to point to *for this tx*.
// Use the same address you put in your Authorization (unsignedAuth.address).
const txParams: any = {
  from: walletAddress,
  to: walletAddress,                 // no-op self-call
  value: "0x0",
  data: "0x",                        // empty calldata
  type: "0x04",
  // tip/fee fields help some RPCs; tweak if needed
  maxPriorityFeePerGas: "0x77359400", // 2 gwei
  maxFeePerGas: "0x3b9aca00",         // 1 gwei (bump if needed)
  gas: "0x030d40",                    // 200k
  authorizationList: [
    {
      chainId: "0x" + unsignedAuth.chainId.toString(16),
      address: unsignedAuth.address,      // <-- DELEGATE, not your EOA
      nonce: "0x" + unsignedAuth.nonce.toString(16),
      yParity,
      r, s,
    },
  ],
};

console.log("Sending 7702 tx (no-op)...");
const txHash: string = await (eip1193Provider as any).request({
  method: "eth_sendTransaction",
  params: [txParams],
});
console.log("tx hash:", txHash);

const receipt = await provider.waitForTransaction(txHash);
console.log("mined:", receipt.status, receipt.transactionHash);

// Expect getCode(EOA) === "0x" (7702 code is ephemeral for the tx only)
const code = await provider.getCode(walletAddress);
console.log("EOA code after tx:", code);