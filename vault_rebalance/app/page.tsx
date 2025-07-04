'use client';

import { useState } from 'react';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { connectWallet } from './actions/connectWallet';
import { handleRebalance } from './actions/handleRebalance';
import { handleVaultAmountChange } from './actions/handleVaultAmountChange';
import { deposit } from './actions/deposit';
import { withdraw } from './actions/withdraw';
import { VaultForTracking } from './actions/addVaultForTracking';
import { addVaultForTracking } from './actions/addVaultForTracking';

import dotenv from 'dotenv';
dotenv.config();

console.log('COMPASS_API_KEY', process.env.NEXT_PUBLIC_COMPASS_API_KEY);

const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY as string
});
// Type declaration for ethereum window object
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
        };
    }
}

export default function Page() {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    const [vaults, setVaults] = useState<VaultForTracking[]>([]);
    const [loading, setLoading] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState('');
    const [vaultRebalanceAmounts, setVaultRebalanceAmounts] = useState<{ [key: string]: string }>({});
    const [depositVaultAddress, setDepositVaultAddress] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawVaultAddress, setWithdrawVaultAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [trackVaultAddress, setTrackVaultAddress] = useState('');
    const [vaultDepositAmounts, setVaultDepositAmounts] = useState<{ [address: string]: string }>({});
    const [vaultWithdrawAmounts, setVaultWithdrawAmounts] = useState<{ [address: string]: string }>({});

    async function refetchAllVaults() {
        setLoading(true);
        try {
            const updatedVaults = await Promise.all(
                vaults.map(async (vault) => {
                    const response = await compassApiSDK.erc4626Vaults.vault({
                        vaultAddress: vault.address,
                        chain: "base:mainnet",
                        userAddress: walletAddress,
                    });
                    return { ...response, address: vault.address }
                })
            );
            setVaults(updatedVaults);
        } catch (e) {
            setTransactionStatus("Failed to refetch vaults");
        }
        setLoading(false);
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
            data-oid="05hzf2u"
        >
            {/* Header */}
            <header className="bg-white shadow-sm border-b" data-oid="-qzzc--">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-oid="doz7r1p">
                    <div className="flex justify-between items-center" data-oid="eudspgc">
                        <div className="flex items-center space-x-3" data-oid="s7k_v-z">
                            <div
                                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center"
                                data-oid="0wsr9:y"
                            >
                                <span className="text-white font-bold text-sm" data-oid="no2b2ql">
                                    C
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900" data-oid="9mmzgly">
                                Vault rebalancing
                            </h1>
                        </div>

                        {!isConnected ? (
                            <button
                                onClick={async () => await connectWallet(setLoading, setWalletAddress, setIsConnected, setVaults, compassApiSDK)}
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                                data-oid="slwvc-5"
                            >
                                {loading ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3" data-oid="nbnq:7q">
                                <div
                                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                    data-oid="jufvzrx"
                                >
                                    Connected
                                </div>
                                <div className="text-sm text-gray-600" data-oid="mj6-cq1">
                                    {walletAddress}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="e5epmo_">
                <div className="text-center mb-12" data-oid="fm3m4_7">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4" data-oid="b78izdb">
                        Compass Vault Manager
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-oid="2d7kw2g">
                        Manage allocations across any ERC-4626 yield vault. View positions and performance, deposit or withdraw funds, and rebalance your portfolio, all in one place.
                    </p>
                </div>
                {/* Track Vault Section */}
                {isConnected && (
                    <div className="mb-8 bg-white rounded-xl shadow-lg p-6" data-oid="track-vault-section">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Track Vault</h3>
                        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vault Address</label>
                                <input
                                    type="text"
                                    value={trackVaultAddress}
                                    onChange={(e) => setTrackVaultAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    if (!trackVaultAddress) {
                                        setTransactionStatus('Please enter a vault address.');
                                        return;
                                    }
                                    console.log('trackVaultAddress', trackVaultAddress);
                                    await addVaultForTracking(
                                        compassApiSDK,
                                        setVaults,
                                        vaults,
                                        trackVaultAddress,
                                        setTransactionStatus,
                                        walletAddress
                                    );
                                }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                                disabled={!trackVaultAddress}
                            >
                                Track Vault
                            </button>
                        </div>
                        {transactionStatus && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                <div className="text-blue-800 text-sm">{transactionStatus}</div>
                            </div>
                        )}
                    </div>
                )}

                {!isConnected ? (
                    /* Welcome State */
                    <div
                        className="bg-white rounded-xl shadow-lg p-8 text-center"
                        data-oid="6nuc0uw"
                    >
                        <div
                            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                            data-oid="i.:6jzi"
                        >
                            <svg
                                className="w-8 h-8 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                data-oid="h2w:jcj"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    data-oid="dv6y_hs"
                                />
                            </svg>
                        </div>
                        <h3
                            className="text-2xl font-semibold text-gray-900 mb-2"
                            data-oid="9fd.sal"
                        >
                            Connect Your Wallet
                        </h3>
                        <p className="text-gray-600 mb-6" data-oid="50hbyu1">
                            Connect your Wallet to view your vault positions and start
                            rebalancing
                        </p>
                        <button
                            onClick={async () => await connectWallet(setLoading, setWalletAddress, setIsConnected, setVaults, compassApiSDK)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                            data-oid="zlj2rd2"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : (
                    /* Connected State */
                    <div className="w-full" data-oid="q0x7m8c">
                        {/* Vault Positions */}
                        <div className="bg-white rounded-xl shadow-lg p-6" data-oid="w2qzmur">
                            <h3
                                className="text-xl font-semibold text-gray-900 mb-4"
                                data-oid=".9l_c-o"
                            >
                                Vault Positions
                            </h3>
                            {loading ? (
                                <div
                                    className="flex items-center justify-center py-8"
                                    data-oid="_7l79m0"
                                >
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
                                        data-oid="5tr40ec"
                                    ></div>
                                    <span className="ml-2 text-gray-600" data-oid="wg4.fwu">
                                        Loading vault positions...
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-4" data-oid=":qw4d99">
                                    {vaults.map((vault, index) => (
                                        <div
                                            key={vault.address}
                                            className="border border-gray-200 rounded-lg p-4"
                                            data-oid="x7.icqj"
                                        >
                                            <div
                                                className="flex justify-between items-start mb-2"
                                                data-oid="y..i.81"
                                            >
                                                <div data-oid="41d0xsk">
                                                    <div
                                                        className="font-medium text-gray-900"
                                                        data-oid=".qrj7kr"
                                                    >
                                                        {vault.name}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-500 flex items-center gap-2"
                                                        data-oid="tgut7da"
                                                    >
                                                        <span>
                                                            {vault.address.slice(0, 6)}...
                                                            {vault.address.slice(-4)}
                                                        </span>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(vault.address)}
                                                            className="p-1 hover:bg-gray-100 rounded"
                                                            title="Copy address"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {/* APYs */}
                                                    <div className="mt-2 text-xs text-gray-700">
                                                        <div>APY 1d: <span className="font-mono">{vault.apy?.apy1Day ? Number(vault.apy.apy1Day).toFixed(2) : '-'}</span>%</div>
                                                        <div>APY 7d: <span className="font-mono">{vault.apy?.apy7Day ? Number(vault.apy.apy7Day).toFixed(2) : '-'}</span>%</div>
                                                        <div>APY 30d: <span className="font-mono">{vault.apy?.apy30Day ? Number(vault.apy.apy30Day).toFixed(2) : '-'}</span>%</div>
                                                    </div>
                                                </div>
                                                <div className="text-right" data-oid="3man7uk">
                                                    <div
                                                        className="font-semibold text-gray-900"
                                                        data-oid="3s.n7pf"
                                                    >
                                                        {vault.userPosition ? `${vault.userPosition.tokenAmount}` : '0'} {vault.asset.symbol}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-600"
                                                        data-oid="tk88a_j"
                                                    >
                                                        Shares: {vault.userPosition ? vault.userPosition.shares : 0}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Deposit functionality */}
                                            <div className="flex flex-col md:flex-row md:items-end gap-2 mb-2">
                                                <input
                                                    type="number"
                                                    value={vaultDepositAmounts[vault.address] || ''}
                                                    onChange={e => setVaultDepositAmounts(a => ({ ...a, [vault.address]: e.target.value }))}
                                                    placeholder="Deposit amount (USD)"
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <button
                                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-lg"
                                                    onClick={async () => {
                                                        if (!vaultDepositAmounts[vault.address]) {
                                                            setTransactionStatus('Please enter a deposit amount.');
                                                            return;
                                                        }
                                                        await deposit({
                                                            compassApiSDK,
                                                            vaultAddress: vault.address,
                                                            amount: vaultDepositAmounts[vault.address],
                                                            setTransactionStatus,
                                                            walletAddress,
                                                        });
                                                        await refetchAllVaults();
                                                    }}
                                                    disabled={!vaultDepositAmounts[vault.address]}
                                                >
                                                    Deposit
                                                </button>
                                            </div>
                                            {/* Withdraw functionality */}
                                            <div className="flex flex-col md:flex-row md:items-end gap-2">
                                                <input
                                                    type="number"
                                                    value={vaultWithdrawAmounts[vault.address] || ''}
                                                    onChange={e => setVaultWithdrawAmounts(a => ({ ...a, [vault.address]: e.target.value }))}
                                                    placeholder="Withdraw amount (USD)"
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <button
                                                    className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-1 rounded-lg"
                                                    onClick={async () => {
                                                        if (!vaultWithdrawAmounts[vault.address]) {
                                                            setTransactionStatus('Please enter a withdraw amount.');
                                                            return;
                                                        }
                                                        await withdraw({
                                                            compassApiSDK,
                                                            vaultAddress: vault.address,
                                                            amount: vaultWithdrawAmounts[vault.address],
                                                            setTransactionStatus,
                                                            walletAddress,
                                                        });
                                                        await refetchAllVaults();
                                                    }}
                                                    disabled={!vaultWithdrawAmounts[vault.address]}
                                                >
                                                    Withdraw
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Rebalancing Interface - Full Width */}
                {isConnected && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6" data-oid="e2crsuo">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4" data-oid="kgxduwh">
                            Rebalance Vaults
                        </h3>

                        <div className="space-y-6" data-oid="1-r3izg">
                            {/* Vault Positions List */}
                            <div data-oid="p.zwxui">
                                <h4
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid="xs2icme"
                                >
                                    Your Vault Positions
                                </h4>
                                {loading && vaults.length === 0 ? (
                                    <div
                                        className="flex items-center justify-center py-8"
                                        data-oid="y:2862h"
                                    >
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                                            data-oid="-v4887k"
                                        ></div>
                                        <span className="ml-2 text-gray-600" data-oid="65hyqgj">
                                            Loading vault positions...
                                        </span>
                                    </div>
                                ) : vaults.length === 0 ? (
                                    <div
                                        className="text-center py-8 text-gray-500"
                                        data-oid="yj5fl0:"
                                    >
                                        <p data-oid="59sbx_j">No vault positions found</p>
                                    </div>
                                ) : (
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                                        data-oid="ol6o8c9"
                                    >
                                        {vaults.map((vault, index) => (
                                            <div
                                                key={vault.address}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                data-oid="grh0hvq"
                                            >
                                                <div className="mb-3" data-oid="y9hwolr">
                                                    <h5
                                                        className="font-medium text-gray-900 text-sm mb-1"
                                                        data-oid="k3ub5fk"
                                                    >
                                                        {vault.name}
                                                    </h5>
                                                    <div
                                                        className="text-xs text-gray-500 mb-2"
                                                        data-oid="wg__4a:"
                                                    >
                                                        {vault.address.slice(0, 6)}...
                                                        {vault.address.slice(-4)}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-600"
                                                        data-oid="zmrk8ad"
                                                    >
                                                        Current Assets: {vault.userPosition ? vault.userPosition.tokenAmount : '0'} {vault.asset.symbol}
                                                    </div>
                                                </div>

                                                <div data-oid="r_:6-he">
                                                    <label
                                                        className="block text-xs font-medium text-gray-700 mb-1"
                                                        data-oid="q8-8p4h"
                                                    >
                                                        Rebalance Amount (USD)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={
                                                            vaultRebalanceAmounts[
                                                                vault.address
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            handleVaultAmountChange(setVaultRebalanceAmounts, vault.address, e.target.value)
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        data-oid="ol1o1iz"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary and Execute Button */}
                            <div className="border-t border-gray-200 pt-4" data-oid="b__kka-">
                                <div
                                    className="flex justify-between items-center mb-4"
                                    data-oid="a6fvw0j"
                                >
                                    <div data-oid="44.xsn1">
                                        <h4
                                            className="font-medium text-gray-900"
                                            data-oid="aq2nsgc"
                                        >
                                            Rebalance Summary
                                        </h4>
                                        <p className="text-sm text-gray-600" data-oid="vhwb.qq">
                                            Vaults with amounts:{' '}
                                            {
                                                Object.entries(vaultRebalanceAmounts).filter(
                                                    ([_, amount]) =>
                                                        amount && parseFloat(amount) > 0,
                                                ).length
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right" data-oid="xaf:467">
                                        <div className="text-sm text-gray-600" data-oid="7ar97zt">
                                            Total Amount
                                        </div>
                                        <div
                                            className="font-semibold text-gray-900"
                                            data-oid="cje:osl"
                                        >
                                            $
                                            {Object.values(vaultRebalanceAmounts)
                                                .reduce(
                                                    (sum, amount) =>
                                                        sum + (parseFloat(amount) || 0),
                                                    0,
                                                )
                                                .toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRebalance({ compassApiSDK, vaultPositions: vaults, vaultRebalanceAmounts, walletAddress, setTransactionStatus })}
                                    disabled={
                                        loading ||
                                        Object.entries(vaultRebalanceAmounts).filter(
                                            ([_, amount]) => amount && parseFloat(amount) > 0,
                                        ).length === 0
                                    }
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    data-oid="4m7.5ai"
                                >
                                    {loading ? 'Processing...' : 'Execute Rebalance'}
                                </button>

                                {transactionStatus && (
                                    <div
                                        className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4"
                                        data-oid="91:-uih"
                                    >
                                        <div className="text-green-800 text-sm" data-oid="7mt5f:7">
                                            {transactionStatus}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16" data-oid="5cg1-4i">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="z-gt:.p">
                    <div className="text-center text-gray-600" data-oid="57aj3vs">
                        <p data-oid="uol:v-u">
                            Powered by Compass Labs API •
                            <a
                                href="https://docs.compasslabs.ai"
                                className="text-blue-600 hover:text-blue-700 ml-1"
                                data-oid="wk24tig"
                            >
                                View Documentation
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
