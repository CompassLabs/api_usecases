import type { BridgeContext, EarnAccountsResult, BurnResult, AttestationResult } from "./types.js";
import { sendAndConfirmTransaction, executeGasSponsoredTransaction, sleep } from "./helpers.js";

const SOURCE_CHAIN = "base";
const DESTINATION_CHAIN = "arbitrum";
const ATTESTATION_POLL_INTERVAL_MS = 10000; // 10 seconds
const ATTESTATION_MAX_ATTEMPTS = 60; // 10 minutes max wait time

/**
 * Step 1: Create Earn Accounts on both chains
 */
export async function createEarnAccounts(ctx: BridgeContext): Promise<EarnAccountsResult> {
  console.log("Step 1: Creating Earn Accounts on Base and Arbitrum...\n");

  // Create Earn Account on Base (source chain)
  console.log("Creating Earn Account on Base...");
  const baseResponse = await ctx.compass.earn.earnCreateAccount({
    chain: SOURCE_CHAIN,
    sender: ctx.ownerAddress,
    owner: ctx.ownerAddress,
    estimateGas: true,
  });

  console.log(`Base Earn Account Address: ${baseResponse.earnAccountAddress}`);

  if (baseResponse.transaction) {
    await sendAndConfirmTransaction(
      ctx.base.userWallet,
      ctx.base.publicClient,
      baseResponse.transaction,
      "Base account creation"
    );
    console.log("Base Earn Account created successfully!");
  } else {
    console.log("Base Earn Account already exists.");
  }

  // Create Earn Account on Arbitrum (destination chain)
  console.log("\nCreating Earn Account on Arbitrum...");
  const arbitrumResponse = await ctx.compass.earn.earnCreateAccount({
    chain: DESTINATION_CHAIN,
    sender: ctx.ownerAddress,
    owner: ctx.ownerAddress,
    estimateGas: true,
  });

  console.log(`Arbitrum Earn Account Address: ${arbitrumResponse.earnAccountAddress}`);

  if (arbitrumResponse.transaction) {
    await sendAndConfirmTransaction(
      ctx.arbitrum.userWallet,
      ctx.arbitrum.publicClient,
      arbitrumResponse.transaction,
      "Arbitrum account creation"
    );
    console.log("Arbitrum Earn Account created successfully!");
  } else {
    console.log("Arbitrum Earn Account already exists.");
  }

  console.log("\nEarn Accounts ready on both chains.\n");

  return {
    baseAddress: baseResponse.earnAccountAddress,
    arbitrumAddress: arbitrumResponse.earnAccountAddress,
  };
}

/**
 * Step 2: Fund Earn Account on source chain with USDC
 */
export async function fundEarnAccount(ctx: BridgeContext, amount: string): Promise<`0x${string}`> {
  console.log("Step 2: Funding Earn Account on Base with USDC...\n");

  const fundResponse = await ctx.compass.earn.earnTransfer({
    owner: ctx.ownerAddress,
    chain: SOURCE_CHAIN,
    token: "USDC",
    amount: amount,
    action: "DEPOSIT",
    spender: ctx.sponsorAddress,
    gasSponsorship: true,
  });

  const eip712 = fundResponse.eip712;
  if (!eip712) {
    throw new Error("No EIP-712 data returned for gas-sponsored fund transfer");
  }
  console.log("Received EIP-712 typed data for fund transfer\n");

  const txHash = await executeGasSponsoredTransaction(ctx, "base", eip712, "fund");
  console.log(`View on BaseScan: https://basescan.org/tx/${txHash}`);
  console.log("Earn Account funded successfully!\n");

  return txHash;
}

/**
 * Step 3: Execute burn transaction on source chain
 */
export async function executeBurn(ctx: BridgeContext, amount: string): Promise<BurnResult> {
  console.log("Step 3: Building gas-sponsored burn transaction on Base...\n");

  const burnResponse = await ctx.compass.bridge.cctpBurn({
    owner: ctx.ownerAddress,
    chain: SOURCE_CHAIN,
    amount: amount,
    destinationChain: DESTINATION_CHAIN,
    gasSponsorship: true,
    transferMode: "fast",
  });

  console.log(burnResponse)
  const bridgeId = burnResponse.bridgeId;
  if (!bridgeId) {
    throw new Error("No bridge ID returned from burn transaction");
  }
  console.log(`Bridge ID: ${bridgeId}`);

  const eip712 = burnResponse.eip712;
  if (!eip712) {
    throw new Error("No EIP-712 data returned for gas-sponsored burn");
  }
  console.log("Received EIP-712 typed data for burn transaction\n");

  const burnTxHash = await executeGasSponsoredTransaction(ctx, "base", eip712, "burn");
  console.log(`View on BaseScan: https://basescan.org/tx/${burnTxHash}\n`);

  return { bridgeId, burnTxHash };
}

/**
 * Step 4: Wait for Circle attestation
 */
export async function waitForAttestation(
  ctx: BridgeContext,
  bridgeId: string,
  burnTxHash: string
): Promise<AttestationResult> {
  console.log("Step 4: Waiting for Circle attestation...\n");
  console.log("Initiating mint preparation...");

  let mintResponse = await ctx.compass.bridge.cctpMint({
    bridgeId: bridgeId,
    burnTxHash: burnTxHash,
    sender: ctx.sponsorAddress,
  });

  // Check if already completed or ready
  if (mintResponse.status === "completed") {
    console.log("Bridge already completed!\n");
    return { mintResponse, alreadyCompleted: true };
  }

  if (mintResponse.status === "ready" || (mintResponse as any).transaction) {
    console.log("Attestation already ready!\n");
    return { mintResponse, alreadyCompleted: false };
  }

  // Poll for attestation
  let attempts = 0;
  while (attempts < ATTESTATION_MAX_ATTEMPTS) {
    attempts++;
    console.log(`Polling for attestation (attempt ${attempts}/${ATTESTATION_MAX_ATTEMPTS})...`);

    await sleep(ATTESTATION_POLL_INTERVAL_MS);

    mintResponse = await ctx.compass.bridge.cctpMint({
      bridgeId: bridgeId,
      burnTxHash: burnTxHash,
      sender: ctx.sponsorAddress,
    });

    if (mintResponse.status === "completed") {
      console.log("Bridge already completed!\n");
      return { mintResponse, alreadyCompleted: true };
    }

    if (mintResponse.status === "ready" || (mintResponse as any).transaction) {
      console.log("Attestation received! Ready to mint.\n");
      return { mintResponse, alreadyCompleted: false };
    }

    if (mintResponse.status === "pending") {
      console.log(`Status: pending. Waiting ${ATTESTATION_POLL_INTERVAL_MS / 1000}s before retry...`);
    } else {
      console.log(`Status: ${mintResponse.status || "unknown"}. Waiting...`);
    }
  }

  throw new Error(
    `Attestation not ready after ${ATTESTATION_MAX_ATTEMPTS} attempts. ` +
    `You can manually complete the mint later using bridge ID: ${bridgeId}`
  );
}

/**
 * Step 5: Execute mint transaction on destination chain
 */
export async function executeMint(ctx: BridgeContext, mintResponse: any): Promise<`0x${string}`> {
  console.log("Step 5: Executing mint transaction on Arbitrum...\n");

  const mintTx = mintResponse.transaction;
  if (!mintTx) {
    throw new Error("No transaction returned for mint");
  }

  console.log("Sponsor submitting mint transaction...");
  const mintTxHash = await sendAndConfirmTransaction(
    ctx.arbitrum.sponsorWallet,
    ctx.arbitrum.publicClient,
    mintTx,
    "Mint"
  );
  console.log(`View on Arbiscan: https://arbiscan.io/tx/${mintTxHash}\n`);

  return mintTxHash;
}
