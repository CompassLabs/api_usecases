/**
 * CCTP Bridge Example: Base -> Arbitrum using Compass API Earn Accounts
 * WITH GAS SPONSORSHIP
 *
 * This example demonstrates how to bridge USDC from Base to Arbitrum using
 * Circle's Cross-Chain Transfer Protocol (CCTP) via Compass API's Earn Accounts.
 * Gas fees are paid by a sponsor wallet using EIP-712 signed messages for burn,
 * and direct transaction submission for mint.
 *
 * Flow:
 * 1. Create Earn Accounts on both source (Base) and destination (Arbitrum) chains
 * 2. Fund the Earn Account on source chain (deposit USDC from wallet to Earn Account)
 * 3. Call /v2/cctp/burn with gasSponsorship=true to get EIP-712 typed data
 * 4. User signs the EIP-712 message, sponsor submits the burn transaction
 * 5. Poll /v2/cctp/mint until attestation is ready (uses statusUrl for efficient polling)
 * 6. Sponsor submits the mint transaction directly on Arbitrum (destination chain)
 */

import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base, arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";

import type { BridgeContext } from "./types.js";
import {
  createEarnAccounts,
  fundEarnAccount,
  executeBurn,
  waitForAttestation,
  executeMint,
} from "./steps.js";

dotenv.config();

// ============================================
// Configuration
// ============================================

const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
const PRIVATE_KEY = (
  process.env.PRIVATE_KEY?.startsWith("0x")
    ? process.env.PRIVATE_KEY
    : `0x${process.env.PRIVATE_KEY}`
) as `0x${string}`;
const GAS_SPONSOR_PK = (
  process.env.GAS_SPONSOR_PK?.startsWith("0x")
    ? process.env.GAS_SPONSOR_PK
    : `0x${process.env.GAS_SPONSOR_PK}`
) as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL as string;
const SERVER_URL = process.env.SERVER_URL as string | undefined;

const AMOUNT_TO_BRIDGE = "1"; // 1 USDC
const SOURCE_CHAIN = "base";
const DESTINATION_CHAIN = "arbitrum";

// ============================================
// Main Driver
// ============================================

async function main() {
  console.log("=== CCTP Bridge: Base -> Arbitrum via Compass Earn Accounts ===\n");

  // Validate environment variables
  if (!COMPASS_API_KEY || !WALLET_ADDRESS || !PRIVATE_KEY || !GAS_SPONSOR_PK || !BASE_RPC_URL || !ARBITRUM_RPC_URL) {
    throw new Error(
      "Missing required environment variables. Please check your .env file. " +
      "Required: COMPASS_API_KEY, WALLET_ADDRESS, PRIVATE_KEY, GAS_SPONSOR_PK, BASE_RPC_URL, ARBITRUM_RPC_URL"
    );
  }

  // Initialize accounts
  const userAccount = privateKeyToAccount(PRIVATE_KEY);
  const sponsorAccount = privateKeyToAccount(GAS_SPONSOR_PK);

  console.log(`Owner wallet: ${userAccount.address}`);
  console.log(`Sponsor wallet: ${sponsorAccount.address}`);
  console.log(`Bridging ${AMOUNT_TO_BRIDGE} USDC from ${SOURCE_CHAIN} to ${DESTINATION_CHAIN}\n`);

  // Build context with all clients
  const ctx: BridgeContext = {
    compass: new CompassApiSDK({
      apiKeyAuth: COMPASS_API_KEY,
      serverURL: SERVER_URL,
    }),
    ownerAddress: WALLET_ADDRESS,
    sponsorAddress: sponsorAccount.address,
    base: {
      userWallet: createWalletClient({
        account: userAccount,
        chain: base,
        transport: http(BASE_RPC_URL),
      }),
      sponsorWallet: createWalletClient({
        account: sponsorAccount,
        chain: base,
        transport: http(BASE_RPC_URL),
      }),
      publicClient: createPublicClient({
        chain: base,
        transport: http(BASE_RPC_URL),
      }),
    },
    arbitrum: {
      userWallet: createWalletClient({
        account: userAccount,
        chain: arbitrum,
        transport: http(ARBITRUM_RPC_URL),
      }),
      sponsorWallet: createWalletClient({
        account: sponsorAccount,
        chain: arbitrum,
        transport: http(ARBITRUM_RPC_URL),
      }),
      publicClient: createPublicClient({
        chain: arbitrum,
        transport: http(ARBITRUM_RPC_URL),
      }),
    },
  };

  console.log(`Using SERVER_URL: ${SERVER_URL}\n`);

  // Execute the bridge flow
  await createEarnAccounts(ctx);
  await fundEarnAccount(ctx, AMOUNT_TO_BRIDGE);
  const { bridgeId, burnTxHash } = await executeBurn(ctx, AMOUNT_TO_BRIDGE);
  const { mintResponse, alreadyCompleted } = await waitForAttestation(ctx, bridgeId, burnTxHash);

  let mintTxHash: `0x${string}` | undefined;
  if (!alreadyCompleted) {
    mintTxHash = await executeMint(ctx, mintResponse);
  }

  // Summary
  console.log("=== Bridge Complete (Gas Sponsored) ===");
  console.log(`Successfully bridged ${AMOUNT_TO_BRIDGE} USDC from Base to Arbitrum`);
  console.log(`Bridge ID: ${bridgeId}`);
  console.log(`Burn TX: https://basescan.org/tx/${burnTxHash}`);
  if (mintTxHash) {
    console.log(`Mint TX: https://arbiscan.io/tx/${mintTxHash}`);
  }
  console.log(`\nGas fees were paid by sponsor: ${sponsorAccount.address}`);
}

// Run the main function
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
