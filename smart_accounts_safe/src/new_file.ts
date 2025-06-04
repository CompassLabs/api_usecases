import {  PredictedSafeProps, SafeAccountConfig, SafeConfig, SafeDeploymentConfig } from '@safe-global/protocol-kit'
import Safe  from '@safe-global/protocol-kit'
import { arbitrum } from 'viem/chains'


const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as string;
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS as string;

async function main() {
const safeAccountConfig: SafeAccountConfig = {
    owners: [SIGNER_ADDRESS],
    threshold: 1
}
  
const predictedSafe: PredictedSafeProps = {
    safeAccountConfig
}
  
const protocolKit = await Safe.init({
    provider: arbitrum.rpcUrls.default.http[0],
    signer: SIGNER_PRIVATE_KEY,
    predictedSafe
  })

const safeAddress = await protocolKit.getAddress()

const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

const client = await protocolKit.getSafeProvider().getExternalSigner()

const transactionHash = await client.sendTransaction({
  to: deploymentTransaction.to,
  value: BigInt(deploymentTransaction.value),
  data: deploymentTransaction.data as `0x${string}`,
  chain: arbitrum
})

const transactionReceipt = await client.waitForTransactionReceipt({
  hash: transactionHash
})

const newProtocolKit = await protocolKit.connect({
    safeAddress
})
  
const isSafeDeployed = await newProtocolKit.isSafeDeployed() // True
const safeOwners = await newProtocolKit.getOwners()
const safeThreshold = await newProtocolKit.getThreshold()
}

main()

