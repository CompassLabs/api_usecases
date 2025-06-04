import {  PredictedSafeProps, SafeAccountConfig } from '@safe-global/protocol-kit'
import Safe from '@safe-global/protocol-kit'
import { arbitrum } from 'viem/chains'
import { Call, createPublicClient, http } from 'viem'
import SafeApiKit from '@safe-global/api-kit'
import {
  MetaTransactionData,
  OperationType
} from '@safe-global/types-kit'
import { CompassApiSDK } from '@compass-labs/api-sdk';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as string;
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS as string;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const SAFE_TX_SERVICE_URL = process.env.SAFE_TX_SERVICE_URL;
const COMPASS_API_KEY = process.env.COMPASS_API_KEY;

async function deploySafe() {
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

    const publicClient = createPublicClient({
        chain: arbitrum,
        transport: http(arbitrum.rpcUrls.default.http[0])
    })

    const transactionHash = await client?.sendTransaction({
        to: deploymentTransaction.to,
        value: BigInt(deploymentTransaction.value),
        data: deploymentTransaction.data as `0x${string}`,
        chain: arbitrum
    })

    const transactionReceipt = await publicClient?.waitForTransactionReceipt({
        hash: transactionHash as `0x${string}`
    })

    if (transactionReceipt?.status === 'success') {
        console.log('Safe deployed successfully', safeAddress)
    } else {
        throw new Error('Safe deployment failed')
    }

    return safeAddress
}

async function executeSafeTransaction(safeAddress: string) {
    const protocolKit = await Safe.init({
        provider: arbitrum.rpcUrls.default.http[0],
        signer: SIGNER_PRIVATE_KEY,
        safeAddress
    })

    const newProtocolKit = await protocolKit.connect({
        safeAddress
    })

    const isSafeDeployed = await newProtocolKit.isSafeDeployed()

    if (!isSafeDeployed) {
        throw new Error('Safe is not deployed')
    }

    const safeOwners = await newProtocolKit.getOwners()
    const safeThreshold = await newProtocolKit.getThreshold()

    console.log(safeOwners, safeThreshold)

    const safeApiKit = new SafeApiKit(
        {
            chainId: BigInt(arbitrum.id),
            txServiceUrl: SAFE_TX_SERVICE_URL
        }
    )

    const safeServiceInfo = await safeApiKit.getServiceInfo()

    console.log(safeServiceInfo)

    const compassApiSDK = new CompassApiSDK({
		apiKeyAuth: COMPASS_API_KEY,
	});

    const result = await compassApiSDK.smartAccount.accountBatchedUserOperations({
		chain: 'arbitrum:mainnet',
		operations: [
			{
				body: {
					actionType: 'ALLOWANCE_INCREASE',
					token: 'USDC',
					contractName: 'AaveV3Pool',
					amount: '10',
				},
			},
			{
				body: {
					actionType: 'AAVE_SUPPLY',
					token: 'USDC',
					amount: '10',
				},
			},
		],
	});

	const safeTransactionData = result.operations.map((op) => ({
		to: op.to as `0x${string}`,
		data: op.data as `0x${string}`,
		value: op.value ? String(op.value) : '0',
        operation: OperationType.Call,
	})) as MetaTransactionData[];

    const safeTransaction = await newProtocolKit.createTransaction({
        transactions: safeTransactionData
    })


}

async function main() {
    let safeAddress: string | undefined;
    if (SAFE_ADDRESS === undefined) {
        safeAddress = await deploySafe()
    } else {
        safeAddress = SAFE_ADDRESS
    }
}

main()

