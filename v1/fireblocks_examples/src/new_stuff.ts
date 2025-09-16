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

// console.log(FIREBLOCKS_API_PRIVATE_KEY_PATH);
// console.log(FIREBLOCKS_API_KEY);
// console.log(FIREBLOCKS_VAULT_ACCOUNT_IDS);
// console.log(ChainId.SEPOLIA);
// console.log(ApiBaseUrl.Sandbox);

// --- Fireblocks EIP-1193 provider ---
// const eip1193Provider = new FireblocksWeb3Provider({
//   apiBaseUrl: ApiBaseUrl.Sandbox,              // Sandbox workspace
//   privateKey: FIREBLOCKS_API_PRIVATE_KEY_PATH, // path to PEM key file
//   apiKey: FIREBLOCKS_API_KEY,
//   vaultAccountIds: FIREBLOCKS_VAULT_ACCOUNT_IDS,
//   chainId: ChainId.SEPOLIA,
// });

// --- ethers v5 provider & signer ---
//const provider = new ethers.providers.Web3Provider(eip1193Provider);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const RPC_URL = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const provider = new ethers.QuickNodeProvider( 'base',RPC_URL) //.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
console.log([RPC_URL, PRIVATE_KEY, provider, signer])

const walletAddress = await signer.getAddress();
//const { chainId } = await provider.getNetwork();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//await provider.send("eth_requestAccounts", []); // ensure account is selected/available
//const signer = provider.getSigner();
//const walletAddress = await signer.getAddress();
//const { chainId } = await provider.getNetwork();

console.log({ walletAddress, chainId: 8453 })


const firstSigner = new ethers.Wallet(PRIVATE_KEY, provider);




// ---------- 7702: delegate to WETH on Sepolia ----------
const DELEGATE_WETH_SEPOLIA = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";


const auth = await firstSigner.authorize({
  address: DELEGATE_WETH_SEPOLIA,
  nonce: 3,
  chainId: 8453
});

console.log(auth)

// console.log("Authorization created with nonce:", auth.nonce);
//
// // Per 7702: authorization.nonce = transaction.nonce + 1
// const txNonce = await provider.getTransactionCount(walletAddress, "latest");
// const authNonce = txNonce + 1;
//
// // EIP-712 (commonly used by libs) "Authorization"
// const unsignedAuth = {
//   nonce: authNonce,
//   address: DELEGATE_WETH_SEPOLIA,  // delegate code source
//   chainId: Number(chainId),        // 11155111 for Sepolia
// };

// const types = {
//   Authorization: [
//     { name: "contractAddress", type: "address" },
//     { name: "chainId", type: "uint256" },
//     { name: "nonce", type: "uint256" },
//   ],
// };
//
// const domain = {
//   name: "Authorization",
//   version: "1",
//   chainId: unsignedAuth.chainId,
// };
//
// const value = {
//   contractAddress: unsignedAuth.address,
//   chainId: unsignedAuth.chainId,
//   nonce: unsignedAuth.nonce,
// };
//
// const signedAuth = await (signer as any)._signTypedData(domain, types, value);
// console.log("signedAuth:", signedAuth);
//
// const { r, s, v } = ethers.utils.splitSignature(signedAuth);
// const yParity = v === 27 ? "0x0" : "0x1";
//
// // Fees (hex) — ensure maxFee >= priority
// const feeData = await provider.getFeeData();
// const priority = feeData.maxPriorityFeePerGas ?? ethers.utils.parseUnits("2", "gwei");
// const maxFee   = feeData.maxFeePerGas       ?? ethers.utils.parseUnits("20", "gwei");
//
// const hex = (bn: ethers.BigNumber | number) => ethers.utils.hexValue(bn);
//
// // Build type: 0x04 tx to **self**; delegate = WETH (Sepolia)
// const txParams: any = {
//   from: walletAddress,
//   to: walletAddress,                 // self-call; runs under WETH delegate code
//   value: "0x0",
//   data: "0x",                        // no calldata (minimal)
//   type: "0x04",
//   nonce: hex(txNonce),
//   //gas: hex(200_000),
//   maxPriorityFeePerGas: hex(priority),
//   maxFeePerGas: hex(maxFee),
//   accessList: [],
//   authorizationList: [
//     {
//       chainId: "0x" + unsignedAuth.chainId.toString(16),
//       address: unsignedAuth.address,            // delegate contract (WETH)
//       nonce: "0x" + unsignedAuth.nonce.toString(16),
//       r, s, yParity,
//     },
//   ],
// };
//
//
// console.log("Sending 7702 setCode tx (delegate=WETH Sepolia)...");
//
// // Sign + send with local signer
// const txResponse = await signer.sendTransaction(txParams);
// console.log("tx hash:", txResponse.hash);
//
// const receipt = await txResponse.wait();
// console.log("mined:", receipt.status, receipt.transactionHash);
//
// // 7702 code is ephemeral; this will likely remain "0x"
// const code = await provider.getCode(walletAddress);
// console.log("EOA code after tx:", code);

// console.log("Sending 7702 setCode tx (delegate=WETH Sepolia)...");
// // const txHash: string = await (eip1193Provider as any).request({
// //   method: "eth_sendTransaction",
// //   params: [txParams],
// // });
// console.log("tx hash:", txHash);
//
// const receipt = await provider.waitForTransaction(txHash);
// console.log("mined:", receipt.status, receipt.transactionHash);
//
// // 7702 code is ephemeral; this will likely remain "0x"
// const code = await provider.getCode(walletAddress);
// console.log("EOA code after tx:", code);