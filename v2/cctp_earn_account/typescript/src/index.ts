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
 * 2. Call /v2/cctp/burn with gasSponsorship=true to get EIP-712 typed data
 * 3. User signs the EIP-712 message, sponsor submits the burn transaction
 * 4. Poll /v2/cctp/mint until attestation is ready (uses statusUrl for efficient polling)
 * 5. Sponsor submits the mint transaction directly on Arbitrum (destination chain)
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
// Sponsor wallet - pays gas fees on behalf of the user
const GAS_SPONSOR_PK = (
  process.env.GAS_SPONSOR_PK?.startsWith("0x")
    ? process.env.GAS_SPONSOR_PK
    : `0x${process.env.GAS_SPONSOR_PK}`
) as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL as string;
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL as string;
const SERVER_URL = process.env.SERVER_URL as string | undefined;

// Bridge configuration
const AMOUNT_TO_BRIDGE = "1"; // 1 USDC
const SOURCE_CHAIN = "base";
const DESTINATION_CHAIN = "arbitrum";

// Polling configuration for attestation
const ATTESTATION_POLL_INTERVAL_MS = 10000; // 10 seconds
const ATTESTATION_MAX_ATTEMPTS = 60; // 10 minutes max wait time

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== CCTP Bridge: Base -> Arbitrum via Compass Earn Accounts ===\n");

  // Validate environment variables
  if (!COMPASS_API_KEY || !WALLET_ADDRESS || !PRIVATE_KEY || !GAS_SPONSOR_PK || !BASE_RPC_URL || !ARBITRUM_RPC_URL) {
    throw new Error(
      "Missing required environment variables. Please check your .env file. " +
      "Required: COMPASS_API_KEY, WALLET_ADDRESS, PRIVATE_KEY, GAS_SPONSOR_PK, BASE_RPC_URL, ARBITRUM_RPC_URL"
    );
  }

  // Initialize SDK with debug logging
  const compass = new CompassApiSDK({
    apiKeyAuth: COMPASS_API_KEY,
    serverURL: SERVER_URL,
    debugLogger: console,
  });

  console.log(`Using SERVER_URL: ${SERVER_URL}`);

  // Create account from private key (user who owns the Earn Account)
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Owner wallet: ${account.address}`);

  // Create sponsor account (pays gas fees)
  const sponsorAccount = privateKeyToAccount(GAS_SPONSOR_PK);
  console.log(`Sponsor wallet: ${sponsorAccount.address}`);
  console.log(`Bridging ${AMOUNT_TO_BRIDGE} USDC from ${SOURCE_CHAIN} to ${DESTINATION_CHAIN}\n`);

  // Create wallet clients for user (for signing EIP-712 messages)
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

  // Create sponsor wallet clients (for submitting transactions and paying gas)
  const baseSponsorWalletClient = createWalletClient({
    account: sponsorAccount,
    chain: base,
    transport: http(BASE_RPC_URL),
  });

  const arbitrumSponsorWalletClient = createWalletClient({
    account: sponsorAccount,
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
  // STEP 2: Build and execute burn transaction (gas sponsored)
  // ============================================
  console.log("Step 2: Building gas-sponsored burn transaction on Base...");

  const burnResponse = await compass.bridge.cctpBurn({
    owner: WALLET_ADDRESS,
    chain: SOURCE_CHAIN,
    amount: AMOUNT_TO_BRIDGE,
    destinationChain: DESTINATION_CHAIN,
    gasSponsorship: true,
    transferMode: "fast"
  });

  const bridgeId = burnResponse.bridgeId;
  if (!bridgeId) {
    throw new Error("No bridge ID returned from burn transaction");
  }
  console.log(`Bridge ID: ${bridgeId}`);

  // With gas sponsorship, we receive EIP-712 typed data to sign
  const burnEip712 = burnResponse.eip712;
  if (!burnEip712) {
    throw new Error("No EIP-712 data returned for gas-sponsored burn");
  }
  console.log("Received EIP-712 typed data for burn transaction\n");

  // Normalize types for viem compatibility (SDK returns camelCase keys)
  const burnNormalizedTypes = {
    SafeTx: (burnEip712.types as any).safeTx,
  };

  // User signs the EIP-712 message
  console.log("User signing EIP-712 message for burn...");
  const burnSignature = await baseWalletClient.signTypedData({
    domain: burnEip712.domain as any,
    types: burnNormalizedTypes,
    primaryType: "SafeTx",
    message: burnEip712.message as any,
  });
  console.log("Burn EIP-712 signature obtained\n");

  // Prepare gas-sponsored transaction with user's signature
  console.log("Preparing gas-sponsored burn transaction...");
  const burnSponsorResponse = await compass.gasSponsorship.gasSponsorshipPrepare({
    owner: WALLET_ADDRESS,
    chain: SOURCE_CHAIN,
    eip712: burnEip712 as any,
    signature: burnSignature,
    sender: sponsorAccount.address,
  });

  const burnSponsoredTx = burnSponsorResponse.transaction as any;
  if (!burnSponsoredTx) {
    throw new Error("No transaction returned from gasSponsorshipPrepare for burn");
  }

  // Sponsor signs and submits the burn transaction
  console.log("Sponsor submitting burn transaction...");
  const burnTxHash = await baseSponsorWalletClient.sendTransaction({
    ...burnSponsoredTx,
    value: BigInt(burnSponsoredTx.value || 0),
    gas: burnSponsoredTx.gas ? BigInt(burnSponsoredTx.gas) : undefined,
    maxFeePerGas: BigInt(burnSponsoredTx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(burnSponsoredTx.maxPriorityFeePerGas),
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

  let mintResponse: any;
  let attestationReady = false;
  let completed = false;
  let attempts = 0;

  // Initial call to cctpMint to start the attestation process
  console.log("Initiating mint preparation...");
  mintResponse = await compass.bridge.cctpMint({
    bridgeId: bridgeId,
    burnTxHash: burnTxHash,
    sender: sponsorAccount.address,
  });

  // Check if attestation is already ready
  if (mintResponse.status === "completed"){
    completed = true
  } else if (mintResponse.status === "ready" || mintResponse.transaction) {
    attestationReady = true;
    console.log("Attestation already ready!\n");
  }

  // Poll for attestation using statusUrl if available
  while (!attestationReady && attempts < ATTESTATION_MAX_ATTEMPTS) {
    attempts++;
    console.log(`Polling for attestation (attempt ${attempts}/${ATTESTATION_MAX_ATTEMPTS})...`);

    await sleep(ATTESTATION_POLL_INTERVAL_MS);
      
    mintResponse = await compass.bridge.cctpMint({
      bridgeId: bridgeId,
      burnTxHash: burnTxHash,
      sender: sponsorAccount.address,
    });

    // Check if attestation is ready
    if (mintResponse.status === "completed"){
        completed = true
    } else if (mintResponse.status === "ready" || mintResponse.transaction) {
      attestationReady = true;
      console.log("Attestation received! Ready to mint.\n");
    } else if (mintResponse.status === "pending") {
      console.log(`Status: pending. Waiting ${ATTESTATION_POLL_INTERVAL_MS / 1000}s before retry...`);
    } else {
      console.log(`Status: ${mintResponse.status || "unknown"}. Waiting...`);
    }
  }

  if (!attestationReady) {
    throw new Error(
      `Attestation not ready after ${ATTESTATION_MAX_ATTEMPTS} attempts. ` +
        `You can manually complete the mint later using bridge ID: ${bridgeId}`
    );
  }

  // ============================================
  // STEP 4: Execute mint transaction on Arbitrum
  // ============================================
  console.log("Step 4: Executing mint transaction on Arbitrum...");

  const mintTx = mintResponse.transaction as any;
  if (!mintTx) {
    throw new Error("No transaction returned for mint");
  }

  if (!completed) {
    // Sponsor submits the mint transaction
    console.log("Sponsor submitting mint transaction...");
    const mintTxHash = await arbitrumSponsorWalletClient.sendTransaction({
        ...mintTx,
        value: BigInt(mintTx.value || 0),
        gas: mintTx.gas ? BigInt(mintTx.gas) : undefined,
        maxFeePerGas: BigInt(mintTx.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(mintTx.maxPriorityFeePerGas),
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
    console.log("=== Bridge Complete (Gas Sponsored) ===");
    console.log(`Successfully bridged ${AMOUNT_TO_BRIDGE} USDC from Base to Arbitrum`);
    console.log(`Bridge ID: ${bridgeId}`);
    console.log(`Burn TX: https://basescan.org/tx/${burnTxHash}`);
    console.log(`Mint TX: https://arbiscan.io/tx/${mintTxHash}`);
    console.log(`\nGas fees were paid by sponsor: ${sponsorAccount.address}`);
  } else {
    console.log("=== Bridge Complete (Gas Sponsored) ===");
    console.log(`Successfully bridged ${AMOUNT_TO_BRIDGE} USDC from Base to Arbitrum`);
    console.log(`Bridge ID: ${bridgeId}`);
    console.log(`Burn TX: https://basescan.org/tx/${burnTxHash}`);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
