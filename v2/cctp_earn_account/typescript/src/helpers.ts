import type { BridgeContext } from "./types.js";

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a transaction and waits for confirmation
 */
export async function sendAndConfirmTransaction(
  walletClient: any,
  publicClient: any,
  tx: any,
  label: string
): Promise<`0x${string}`> {
  // Spread original tx to preserve all fields, then convert numeric strings to BigInt
  const txHash = await walletClient.sendTransaction({
    ...tx,
    value: BigInt(tx.value || 0),
    gas: BigInt(tx.gas),
    nonce: tx.nonce !== undefined ? Number(tx.nonce) : undefined,
    maxFeePerGas: BigInt(tx.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
  });
  console.log(`${label} tx: ${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`${label} confirmed in block: ${receipt.blockNumber}`);

  return txHash;
}

/**
 * Executes a gas-sponsored transaction using EIP-712 signing
 *
 * Flow:
 * 1. User signs EIP-712 typed data
 * 2. Prepare sponsored transaction via Compass API
 * 3. Sponsor submits the transaction
 * 4. Wait for confirmation
 */
export async function executeGasSponsoredTransaction(
  ctx: BridgeContext,
  chain: "base" | "arbitrum",
  eip712: any,
  label: string
): Promise<`0x${string}`> {
  const clients = ctx[chain];
  const chainName = chain === "base" ? "base" : "arbitrum";

  // Determine the EIP-712 structure type and normalize for viem
  // SafeTx = Gnosis Safe transactions (burn, manage)
  // PermitTransferFrom = Permit2 token transfers (fund/deposit)
  const isSafeTx = eip712.types.safeTx || eip712.types.SafeTx;
  const isPermit2 = eip712.types.permitTransferFrom || eip712.types.PermitTransferFrom;

  let normalizedTypes: any;
  let primaryType: string;

  if (isSafeTx) {
    normalizedTypes = {
      SafeTx: eip712.types.safeTx || eip712.types.SafeTx,
    };
    primaryType = "SafeTx";
  } else if (isPermit2) {
    normalizedTypes = {
      TokenPermissions: eip712.types.tokenPermissions || eip712.types.TokenPermissions,
      PermitTransferFrom: eip712.types.permitTransferFrom || eip712.types.PermitTransferFrom,
    };
    primaryType = "PermitTransferFrom";
  } else {
    throw new Error(`Unknown EIP-712 type structure: ${Object.keys(eip712.types).join(", ")}`);
  }

  // User signs the EIP-712 message
  console.log(`User signing EIP-712 message for ${label}...`);
  const signature = await clients.userWallet.signTypedData({
    domain: eip712.domain as any,
    types: normalizedTypes,
    primaryType: primaryType,
    message: eip712.message as any,
  });
  console.log(`${label} EIP-712 signature obtained`);

  // Prepare gas-sponsored transaction with user's signature
  console.log(`Preparing gas-sponsored ${label} transaction...`);
  const sponsorResponse = await ctx.compass.gasSponsorship.gasSponsorshipPrepare({
    owner: ctx.ownerAddress,
    chain: chainName,
    eip712: eip712 as any,
    signature: signature,
    sender: ctx.sponsorAddress,
  });

  const sponsoredTx = sponsorResponse.transaction as any;
  if (!sponsoredTx) {
    throw new Error(`No transaction returned from gasSponsorshipPrepare for ${label}`);
  }

  // Sponsor submits the transaction
  console.log(`Sponsor submitting ${label} transaction...`);
  const txHash = await sendAndConfirmTransaction(
    clients.sponsorWallet,
    clients.publicClient,
    sponsoredTx,
    label
  );

  return txHash;
}
