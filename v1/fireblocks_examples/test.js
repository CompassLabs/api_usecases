// test.js

// Simple hello
console.log("Hello from Node.js!");

// A tiny function
function add(a, b) {
  return a + b;
}

console.log("2 + 3 =", add(2, 3));

// Async example
setTimeout(() => {
  console.log("This line appears after 1 second.");
}, 1000);


import { FireblocksWeb3Provider, ChainId, ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";

import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";
import { ContractEnum as Contract } from "@compass-labs/api-sdk/models/operations";

dotenv.config();







//////////
// test.js

// Simple hello
console.log("Hello from Node.js!");
//


//import { CompassApiSDK } from "@compass-labs/api-sdk";
//import dotenv from "dotenv";
//import { privateKeyToAccount } from "viem/accounts";
//import { arbitrum } from "viem/chains";
//import { http, createWalletClient, createPublicClient } from "viem";
//import { ContractEnum as Contract } from "@compass-labs/api-sdk/models/operations";
//
dotenv.config();

//const FIREBLOCKS_API_PRIVATE_KEY_PATH = process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH as string;
const FIREBLOCKS_API_PRIVATE_KEY_PATH = "./fireblocks_secret.key";
const FIREBLOCKS_API_KEY = "4c9228b4-78fe-486a-a1b4-079d2eaef421"

console.log(FIREBLOCKS_API_PRIVATE_KEY_PATH)
//const FIREBLOCKS_API_KEY = process.env.FIREBLOCKS_API_KEY as string;
console.log(FIREBLOCKS_API_KEY)
const FIREBLOCKS_VAULT_ACCOUNT_IDS = 2
console.log(FIREBLOCKS_VAULT_ACCOUNT_IDS)
console.log(ChainId.SEPOLIA)
console.log(ApiBaseUrl.Sandbox)

const eip1193Provider = new FireblocksWeb3Provider({
    apiBaseUrl: ApiBaseUrl.Sandbox, // If using a sandbox workspace
    //privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    privateKey: FIREBLOCKS_API_PRIVATE_KEY_PATH,
    //apiKey: process.env.FIREBLOCKS_API_KEY,
    apiKey: FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.SEPOLIA,
})

console.log(eip1193Provider)

import Web3 from "web3";

const web3 = new Web3(eip1193Provider);
console.log(web3)



/////////////////////////////////////////////////////////////////

//const { FireblocksWeb3Provider, ChainId, ApiBaseUrl } = require("@fireblocks/fireblocks-web3-provider")
//const Web3 = require("web3");

// Import the Sepolia USDC ABI
//const ABI = require("./USDC_SEPOLIA_ABI.json");
const ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_symbol",
                "type": "string"
            },
            {
                "internalType": "uint8",
                "name": "_decimals",
                "type": "uint8"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]



// Sepolia USDC Contract Address
//const CONTRACT_ADDRESS = "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8"
const CONTRACT_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";

(async() => {

  	const web3 = new Web3(eip1193Provider);
  	const myAddr = await web3.eth.getAccounts()
  	const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
  	const spenderAddr = "0x1C7F54560eDc52a2A82BBA0F022A9F53e6a1FFfE"

    // 1 USDC to approve
    const amount = 1e6

    // Invoke approve method
    console.log(
        await contract.methods.approve(spenderAddr, amount).send({
            from: myAddr[0]
        })
    )

})().catch(error => {
    console.log(error)
});


