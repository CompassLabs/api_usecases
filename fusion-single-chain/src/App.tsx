import { useState } from 'react';
import {
  createWalletClient,
  custom,
  erc20Abi,
  http,
  type WalletClient,
  type Hex,
  formatUnits
} from 'viem';
import { base } from 'viem/chains';
import {
  createMeeClient,
  toMultichainNexusAccount,
  getMeeScanLink,
  type MeeClient,
  type MultichainSmartAccount
} from '@biconomy/abstractjs';
import { useReadContract } from 'wagmi';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import VaultTracker from './actions/VaultTracker';
import { deposit } from './actions/deposit';
import type { VaultForTracking } from './actions/addVaultForTracking';
// import { config } from 'dotenv';
// config();

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [meeClient, setMeeClient] = useState<MeeClient | null>(null);
  const [orchestrator, setOrchestrator] = useState<MultichainSmartAccount | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [meeScanLink, setMeeScanLink] = useState<string | null>(null);
  const [vaults, setVaults] = useState<VaultForTracking[]>([]);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('1');
  const [selectedVault, setSelectedVault] = useState<VaultForTracking | null>(null);

  // Initialize Compass API SDK
  const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: import.meta.env.VITE_COMPASS_API_KEY
  });
  const RPC_URL = import.meta.env.VITE_RPC_URL;
 
  const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
 
  const { data: balance } = useReadContract({
    abi: erc20Abi,
    address: usdcAddress,
    chainId: base.id,
    functionName: 'balanceOf',
    args: account ? [account as Hex] : undefined,
    query: { enabled: !!account }
  });
 
  const connectAndInit = async () => {
    if (typeof (window as any).ethereum === 'undefined') {
      alert('MetaMask not detected');
      return;
    }
 
    const wallet = createWalletClient({
      chain: base,
      transport: custom((window as any).ethereum)
    });
    setWalletClient(wallet);
 
    const [address] = await wallet.requestAddresses();
    setAccount(address);
 
    const multiAccount = await toMultichainNexusAccount({
      chains: [base],
      transports: [http(RPC_URL)],
      signer: createWalletClient({
        account: address,
        transport: custom((window as any).ethereum)
      })
    });
    setOrchestrator(multiAccount);
 
    const mee = await createMeeClient({ account: multiAccount });
    setMeeClient(mee);
  };
 
    const executeVaultDeposit = async () => {
    if (!orchestrator || !meeClient || !account || !selectedVault) {
      alert('Account not initialized or no vault selected');
      return;
    }

    try {
      setStatus('Preparing vault deposit…');

    //   await walletClient?.addChain({ chain: base });
    //   await walletClient?.switchChain({ id: base.id });

      // Get deposit transaction from Compass API
      const depositTx = await deposit(
        compassApiSDK,
        selectedVault,
        parseFloat(depositAmount),
        account,
        setTransactionStatus
      );

      setStatus('Building user operations…');

      const userOperations = await Promise.all(depositTx.operations.map(async (operation) => {
        return orchestrator.buildComposable({
          type: 'rawCalldata',
          data: {
            chainId: base.id,
            to: operation.to as `0x${string}`,
            calldata: operation.data as `0x${string}`,
            value: BigInt(operation.value || 0)
          }
        })
      }));

      setStatus('Requesting quote…');
    //   console.log(JSON.stringify(userOperations, null, 2));
      const fusionQuote = await meeClient.getFusionQuote({
        instructions: userOperations,
        trigger: {
          chainId: base.id,
          tokenAddress: usdcAddress,
          amount: BigInt(parseFloat(depositAmount) * 10 ** 6),
        },
        feeToken: {
          address: usdcAddress,
          chainId: base.id
        }
      });

      console.log(fusionQuote);

      setStatus('Executing quote…');
      const { hash } = await meeClient.executeFusionQuote({ fusionQuote });

      const link = getMeeScanLink(hash);
      setMeeScanLink(link);
      setStatus('Waiting for completion…');

      await meeClient.waitForSupertransactionReceipt({ hash });

      setStatus('✅ Vault deposit completed!');
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message ?? err}`);
    }
  };
 
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', color: 'orangered' }}>
      <h1>Compass Vaults </h1>
 
      <button
        style={{ padding: '10px 20px', fontSize: '1rem' }}
        onClick={connectAndInit}
        disabled={!!account}
      >
        {account ? `Connected` : 'Connect Wallet'}
      </button>
 
            {account && (
        <div style={{ marginTop: 20 }}>
          <p><strong>Address:</strong> {account}</p>
          <p>USDC Balance: {balance ? `${formatUnits(balance, 6)} USDC` : '–'}</p>

          <VaultTracker
            compassApiSDK={compassApiSDK}
            vaults={vaults}
            setVaults={setVaults}
            walletAddress={account}
          />

          {vaults.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Deposit to Vault</h3>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Select Vault:</label>
                <select
                  value={selectedVault?.address || ''}
                  onChange={(e) => {
                    const vault = vaults.find(v => v.address === e.target.value);
                    setSelectedVault(vault || null);
                  }}
                  style={{ padding: '6px', width: '100%', marginBottom: 10 }}
                >
                  <option value="">Select a vault...</option>
                  {vaults.map((vault) => (
                    <option key={vault.address} value={vault.address}>
                      {vault.name || vault.address} - {vault.asset?.symbol || 'Unknown Asset'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Deposit Amount (USDC):</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="1.0"
                  min="0.01"
                  step="0.01"
                  style={{ padding: '6px', width: '100%' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
 
            {meeClient && selectedVault && (
        <>
          <p style={{ marginTop: 20 }}>
            🟢 <strong>MEE client ready</strong> – you can now orchestrate multichain transactions!
          </p>

          <button
            style={{ padding: '10px 20px', fontSize: '1rem' }}
            onClick={executeVaultDeposit}
            disabled={!selectedVault || !depositAmount || parseFloat(depositAmount) <= 0}
          >
            Deposit {depositAmount} USDC to {selectedVault.name || 'Vault'}
          </button>
        </>
      )}
 
            {status && <p style={{ marginTop: 20 }}>{status}</p>}
      
      {transactionStatus && <p style={{ marginTop: 10, color: 'blue' }}>{transactionStatus}</p>}

      {meeScanLink && (
        <p style={{ marginTop: 10 }}>
          <a href={meeScanLink} target='_blank' rel='noopener noreferrer'>
            View on MEE Scan
          </a>
        </p>
      )}
    </main>
  );
}