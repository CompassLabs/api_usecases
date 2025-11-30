/**
 * CCTP Bridge Example: Base -> Arbitrum using Compass API Earn Accounts
 *
 * This example demonstrates how to bridge USDC from Base to Arbitrum using
 * Circle's Cross-Chain Transfer Protocol (CCTP) via Compass API's Earn Accounts.
 *
 * Flow:
 * 1. Create Earn Accounts on both source (Base) and destination (Arbitrum) chains
 * 2. Call /v2/cctp/burn to create a burn transaction on Base (source chain)
 * 3. Sign and submit the burn transaction
 * 4. Poll /v2/cctp/mint until attestation is ready
 * 5. Sign and submit the mint transaction on Arbitrum (destination chain)
 */

import { CompassApiSDK } from "@compass-labs/api-sdk";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { base, arbitrum } from "viem/chains";
import { http, createWalletClient, createPublicClient } from "viem";

dotenv.config();

// Environment variables
const COMPASS_API_KEY = process.env.COMPASS_API_KEY as string;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
const PRIVATE_KEY = (
  process.env.PRIVATE_KEY?.startsWith("0x")
    ? process.env.PRIVATE_KEY
    : `0x${process.env.PRIVATE_KEY}`
) as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL as string;
const SERVER_URL = process.env.SERVER_URL as string | undefined;

// Bridge configuration
const AMOUNT_TO_BRIDGE = "5"; // 5 USDC
const SOURCE_CHAIN = "base";
const DESTINATION_CHAIN = "arbitrum";

// Polling configuration for attestation
const ATTESTATION_POLL_INTERVAL_MS = 10000; // 10 seconds
const ATTESTATION_MAX_ATTEMPTS = 600; // 10 minutes max wait time

async function main() {
  console.log("=== CCTP Bridge: Base -> Arbitrum via Compass Earn Accounts ===\n");

  // Validate environment variables
  if (!COMPASS_API_KEY || !WALLET_ADDRESS || !PRIVATE_KEY || !BASE_RPC_URL || !ARBITRUM_RPC_URL) {
    throw new Error(
      "Missing required environment variables. Please check your .env file."
    );
  }

  // Initialize SDK
  const compass = new CompassApiSDK({
    apiKeyAuth: COMPASS_API_KEY,
    serverURL: SERVER_URL,
  });

  // Create account from private key
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Owner wallet: ${account.address}`);
  console.log(`Bridging ${AMOUNT_TO_BRIDGE} USDC from ${SOURCE_CHAIN} to ${DESTINATION_CHAIN}\n`);

  // Create wallet clients for both chains
  const baseWalletClient = createWalletClient({
    account,
    chain: base,
    transport: http(BASE_RPC_URL),
  });

  const basePublicClient = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
  });

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: arbitrum,
    transport: http(ARBITRUM_RPC_URL),
  });

  const arbitrumPublicClient = createPublicClient({
    chain: arbitrum,
    transport: http(ARBITRUM_RPC_URL),
  });

  // ============================================
  // STEP 1: Create Earn Accounts on both chains
  // ============================================
  console.log("Step 1: Creating Earn Accounts on Base and Arbitrum...\n");

  // Create Earn Account on Base (source chain)
  console.log("Creating Earn Account on Base...");
  const baseAccountResponse = await compass.earn.earnCreateAccount({
    chain: SOURCE_CHAIN,
    sender: WALLET_ADDRESS,
    owner: WALLET_ADDRESS,
    estimateGas: true,
  });

  const baseEarnAccountAddress = baseAccountResponse.earnAccountAddress;
  console.log(`Base Earn Account Address: ${baseEarnAccountAddress}`);

  // Only submit transaction if account doesn't exist yet (transaction will be null if it exists)
  if (baseAccountResponse.transaction) {
    const baseCreateTx = baseAccountResponse.transaction as any;
    const baseCreateTxHash = await baseWalletClient.sendTransaction({
      ...baseCreateTx,
      value: BigInt(baseCreateTx.value || 0),
      gas: BigInt(baseCreateTx.gas),
      maxFeePerGas: BigInt(baseCreateTx.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(baseCreateTx.maxPriorityFeePerGas),
    });
    console.log(`Base account creation tx: ${baseCreateTxHash}`);
    await basePublicClient.waitForTransactionReceipt({ hash: baseCreateTxHash });
    console.log("Base Earn Account created successfully!");
  } else {
    console.log("Base Earn Account already exists.");
  }

  // Create Earn Account on Arbitrum (destination chain)
  console.log("\nCreating Earn Account on Arbitrum...");
  const arbitrumAccountResponse = await compass.earn.earnCreateAccount({
    chain: DESTINATION_CHAIN,
    sender: WALLET_ADDRESS,
    owner: WALLET_ADDRESS,
    estimateGas: true,
  });

  const arbitrumEarnAccountAddress = arbitrumAccountResponse.earnAccountAddress;
  console.log(`Arbitrum Earn Account Address: ${arbitrumEarnAccountAddress}`);

  // Only submit transaction if account doesn't exist yet
  if (arbitrumAccountResponse.transaction) {
    const arbCreateTx = arbitrumAccountResponse.transaction as any;
    const arbCreateTxHash = await arbitrumWalletClient.sendTransaction({
      ...arbCreateTx,
      value: BigInt(arbCreateTx.value || 0),
      gas: BigInt(arbCreateTx.gas),
      maxFeePerGas: BigInt(arbCreateTx.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(arbCreateTx.maxPriorityFeePerGas),
    });
    console.log(`Arbitrum account creation tx: ${arbCreateTxHash}`);
    await arbitrumPublicClient.waitForTransactionReceipt({ hash: arbCreateTxHash });
    console.log("Arbitrum Earn Account created successfully!");
  } else {
    console.log("Arbitrum Earn Account already exists.");
  }

  console.log("\nEarn Accounts ready on both chains.\n");

  // ============================================
  // STEP 2: Build and execute burn transaction
  // ============================================
  console.log("Step 2: Building burn transaction on Base...");

  const burnResponse = await compass.cctp.cctpBurn({
    owner: WALLET_ADDRESS,
    chain: SOURCE_CHAIN,
    amount: AMOUNT_TO_BRIDGE,
    destinationChain: DESTINATION_CHAIN,
    destinationAddress: WALLET_ADDRESS, // Bridging to the same owner's earn account on destination
    gasSponsorship: false,
  });

  const bridgeId = burnResponse.bridgeId;
  if (!bridgeId) {
    throw new Error("No bridge ID returned from burn transaction");
  }
  console.log(`Bridge ID: ${bridgeId}`);
  console.log(`Burn transaction built successfully\n`);

  // Sign and submit burn transaction
  console.log("Signing and submitting burn transaction...");
  const burnTransaction = burnResponse.transaction as any;

  const burnTxHash = await baseWalletClient.sendTransaction({
    ...burnTransaction,
    value: BigInt(burnTransaction.value || 0),
    gas: BigInt(burnTransaction.gas),
    maxFeePerGas: BigInt(burnTransaction.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(burnTransaction.maxPriorityFeePerGas),
  });

  console.log(`Burn transaction hash: ${burnTxHash}`);
  console.log(`View on BaseScan: https://basescan.org/tx/${burnTxHash}`);

  // Wait for burn transaction confirmation
  console.log("Waiting for burn transaction confirmation...");
  const burnReceipt = await basePublicClient.waitForTransactionReceipt({
    hash: burnTxHash,
  });
  console.log(`Burn transaction confirmed in block: ${burnReceipt.blockNumber}\n`);

  // ============================================
  // STEP 3: Wait for Circle attestation
  // ============================================
  console.log("Step 3: Waiting for Circle attestation...");
  console.log("(This typically takes 10-20 minutes for finality)\n");

  let mintResponse: any;
  let attestationReady = false;
  let attempts = 0;

  while (!attestationReady && attempts < ATTESTATION_MAX_ATTEMPTS) {
    attempts++;
    console.log(`Polling for attestation (attempt ${attempts}/${ATTESTATION_MAX_ATTEMPTS})...`);

    try {
      mintResponse = await compass.cctp.cctpMint({
        bridgeId: bridgeId,
        owner: WALLET_ADDRESS,
        gasSponsorship: false,
      });

      // Check if response indicates attestation is ready
      // The SDK might throw on 202 or return a status field
      if (mintResponse.status === "ready" || mintResponse.transaction) {
        attestationReady = true;
        console.log("Attestation received! Ready to mint.\n");
      } else if (mintResponse.status === "pending") {
        console.log(`Status: pending. Waiting ${ATTESTATION_POLL_INTERVAL_MS / 1000}s before retry...`);
        await sleep(ATTESTATION_POLL_INTERVAL_MS);
      } else {
        // Unknown status, treat as pending
        console.log(`Status: ${mintResponse.status || "unknown"}. Waiting...`);
        await sleep(ATTESTATION_POLL_INTERVAL_MS);
      }
    } catch (error: any) {
      // Handle 202 Accepted response (attestation pending)
      if (error.statusCode === 202 || error.status === 202) {
        console.log(`Attestation pending (202). Waiting ${ATTESTATION_POLL_INTERVAL_MS / 1000}s before retry...`);
        await sleep(ATTESTATION_POLL_INTERVAL_MS);
      } else {
        throw error;
      }
    }
  }

  if (!attestationReady) {
    throw new Error(
      `Attestation not ready after ${ATTESTATION_MAX_ATTEMPTS} attempts. ` +
        `You can manually complete the mint later using bridge ID: ${bridgeId}`
    );
  }

  // ============================================
  // STEP 4: Execute mint transaction
  // ============================================
  console.log("Step 4: Executing mint transaction on Arbitrum...");

  const mintTransaction = mintResponse.transaction as any;

  const mintTxHash = await arbitrumWalletClient.sendTransaction({
    ...mintTransaction,
    value: BigInt(mintTransaction.value || 0),
    gas: BigInt(mintTransaction.gas),
    maxFeePerGas: BigInt(mintTransaction.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(mintTransaction.maxPriorityFeePerGas),
  });

  console.log(`Mint transaction hash: ${mintTxHash}`);
  console.log(`View on Arbiscan: https://arbiscan.io/tx/${mintTxHash}`);

  // Wait for mint transaction confirmation
  console.log("Waiting for mint transaction confirmation...");
  const mintReceipt = await arbitrumPublicClient.waitForTransactionReceipt({
    hash: mintTxHash,
  });
  console.log(`Mint transaction confirmed in block: ${mintReceipt.blockNumber}\n`);

  // ============================================
  // Summary
  // ============================================
  console.log("=== Bridge Complete ===");
  console.log(`Successfully bridged ${AMOUNT_TO_BRIDGE} USDC from Base to Arbitrum`);
  console.log(`Bridge ID: ${bridgeId}`);
  console.log(`Burn TX: https://basescan.org/tx/${burnTxHash}`);
  console.log(`Mint TX: https://arbiscan.io/tx/${mintTxHash}`);
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the main function
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
