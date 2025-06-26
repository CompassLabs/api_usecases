'use client';

import { useState, useEffect } from 'react';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { MorphoUserPositionRequest } from '@compass-labs/api-sdk/models/operations';
import { VaultPosition } from '@compass-labs/api-sdk/models/components';

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
    const [vaultPositions, setVaultPositions] = useState<VaultPosition[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVault, setSelectedVault] = useState('');
    const [rebalanceAmount, setRebalanceAmount] = useState('');
    const [transactionStatus, setTransactionStatus] = useState('');
    const [vaultRebalanceAmounts, setVaultRebalanceAmounts] = useState<{ [key: string]: string }>(
        {},
    );

    const sdk = new CompassApiSDK({
        apiKeyAuth: process.env.COMPASS_API_KEY,
        serverURL: 'http://localhost:8000',
    });

    const getUserPositions = async (address: string) => {
        const userPositions = await sdk.morpho.userPosition({
            chain: 'ethereum:mainnet',
            userAddress: address,
        } as MorphoUserPositionRequest);

        setVaultPositions(userPositions.vaultPositions);
    };

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                setLoading(true);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setWalletAddress(accounts[0]);
                setIsConnected(true);
                // Simulate fetching user positions
                setTimeout(async () => {
                    await getUserPositions(accounts[0]);
                    setLoading(false);
                }, 1500);
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                setLoading(false);
            }
        } else {
            alert('Please install MetaMask to use this application');
        }

        // NOTE: use this when making designs in onlook

        // setIsConnected(true);
        // setWalletAddress('0xa829B388A3DF7f581cE957a95edbe419dd146d1B');
        // await getUserPositions('0xa829B388A3DF7f581cE957a95edbe419dd146d1B');
    };

    const handleRebalance = async () => {
        const vaultsWithAmounts = Object.entries(vaultRebalanceAmounts).filter(
            ([_, amount]) => amount && parseFloat(amount) > 0,
        );

        if (vaultsWithAmounts.length === 0) {
            alert('Please enter amounts for at least one vault');
            return;
        }

        setLoading(true);
        setTransactionStatus('Constructing bundled transaction...');

        // Simulate API calls to Compass endpoints
        setTimeout(() => {
            setTransactionStatus('Transaction submitted successfully!');
            setLoading(false);
            setTimeout(() => setTransactionStatus(''), 3000);
        }, 2000);
    };

    const handleVaultAmountChange = (vaultAddress: string, amount: string) => {
        setVaultRebalanceAmounts((prev) => ({
            ...prev,
            [vaultAddress]: amount,
        }));
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
            data-oid="5rr6yww"
        >
            {/* Header */}
            <header className="bg-white shadow-sm border-b" data-oid="f-ba9yn">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-oid="steaq14">
                    <div className="flex justify-between items-center" data-oid="k594u0g">
                        <div className="flex items-center space-x-3" data-oid="4bjp2ow">
                            <div
                                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center"
                                data-oid="6.jd8zu"
                            >
                                <span className="text-white font-bold text-sm" data-oid="m3nd1_8">
                                    C
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900" data-oid="2jemx-:">
                                Vault rebalancing
                            </h1>
                        </div>

                        {!isConnected ? (
                            <button
                                onClick={connectWallet}
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                                data-oid="7w7q1wa"
                            >
                                {loading ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3" data-oid="yrfa5hi">
                                <div
                                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                    data-oid="ilmr4q4"
                                >
                                    Connected
                                </div>
                                <div className="text-sm text-gray-600" data-oid="5trculm">
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="m7x3gga">
                {/* Hero Section */}
                <div className="text-center mb-12" data-oid="5:1m0z6">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4" data-oid="qxeqhy9">
                        ERC4626 Vault Rebalancing
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-oid="1y9h::v">
                        Showcase the power of Compass API for automated vault rebalancing. Connect
                        your wallet to view positions and execute rebalancing strategies.
                    </p>
                </div>

                {!isConnected ? (
                    /* Welcome State */
                    <div
                        className="bg-white rounded-xl shadow-lg p-8 text-center"
                        data-oid="j9y27hm"
                    >
                        <div
                            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                            data-oid="d_rb5pq"
                        >
                            <svg
                                className="w-8 h-8 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                data-oid="o8rvq05"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    data-oid="4b3tccs"
                                />
                            </svg>
                        </div>
                        <h3
                            className="text-2xl font-semibold text-gray-900 mb-2"
                            data-oid="3wrt4e8"
                        >
                            Connect Your Wallet
                        </h3>
                        <p className="text-gray-600 mb-6" data-oid="8_8.9r6">
                            Connect your MetaMask wallet to view your vault positions and start
                            rebalancing
                        </p>
                        <button
                            onClick={connectWallet}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                            data-oid="2xhr4h:"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : (
                    /* Connected State */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-oid="5zavp57">
                        {/* Vault Positions */}
                        <div className="bg-white rounded-xl shadow-lg p-6" data-oid="6cnleyy">
                            <h3
                                className="text-xl font-semibold text-gray-900 mb-4"
                                data-oid="vf_3d7c"
                            >
                                Vault Positions
                            </h3>
                            {loading && vaultPositions.length === 0 ? (
                                <div
                                    className="flex items-center justify-center py-8"
                                    data-oid="106z8w0"
                                >
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
                                        data-oid="eu8arrb"
                                    ></div>
                                    <span className="ml-2 text-gray-600" data-oid="v4i9kr3">
                                        Loading vault positions...
                                    </span>
                                </div>
                            ) : vaultPositions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500" data-oid="y8oe94a">
                                    <p data-oid="amgqmkc">No vault positions found</p>
                                </div>
                            ) : (
                                <div className="space-y-4" data-oid=".726o.4">
                                    {vaultPositions.map((position, index) => (
                                        <div
                                            key={position.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                            data-oid="-5h91m:"
                                        >
                                            <div
                                                className="flex justify-between items-start mb-2"
                                                data-oid="q9rtmo1"
                                            >
                                                <div data-oid="mhf2bfz">
                                                    <div
                                                        className="font-medium text-gray-900"
                                                        data-oid="v60.3hg"
                                                    >
                                                        {position.vault.name}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-500"
                                                        data-oid="go_:bni"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                </div>
                                                <div className="text-right" data-oid="64lrtpw">
                                                    <div
                                                        className="font-semibold text-gray-900"
                                                        data-oid="8i7k:v8"
                                                    >
                                                        ${position.state.assetsUsd}
                                                    </div>
                                                    <div
                                                        className="text-sm text-purple-600"
                                                        data-oid="6.k7zo:"
                                                    >
                                                        Assets USD
                                                    </div>
                                                </div>
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
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6" data-oid=".ump7ai">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4" data-oid="2zh72lr">
                            Rebalance Vaults
                        </h3>

                        <div className="space-y-6" data-oid="avlag4x">
                            {/* Vault Positions List */}
                            <div data-oid="2nx30n3">
                                <h4
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid="f13tk3a"
                                >
                                    Your Vault Positions
                                </h4>
                                {loading && vaultPositions.length === 0 ? (
                                    <div
                                        className="flex items-center justify-center py-8"
                                        data-oid="eywze6-"
                                    >
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                                            data-oid="_xw8:_8"
                                        ></div>
                                        <span className="ml-2 text-gray-600" data-oid="sxk6--:">
                                            Loading vault positions...
                                        </span>
                                    </div>
                                ) : vaultPositions.length === 0 ? (
                                    <div
                                        className="text-center py-8 text-gray-500"
                                        data-oid="241gy:q"
                                    >
                                        <p data-oid="x251000">No vault positions found</p>
                                    </div>
                                ) : (
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                        data-oid="aycd9ug"
                                    >
                                        {vaultPositions.map((position, index) => (
                                            <div
                                                key={position.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                data-oid="ukd2glb"
                                            >
                                                <div className="mb-3" data-oid="hynjzxn">
                                                    <h5
                                                        className="font-medium text-gray-900 text-sm mb-1"
                                                        data-oid="kmrvg36"
                                                    >
                                                        {position.vault.name}
                                                    </h5>
                                                    <div
                                                        className="text-xs text-gray-500 mb-2"
                                                        data-oid="4ogi4qq"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-600"
                                                        data-oid="scgcpii"
                                                    >
                                                        Current Assets: ${position.state.assetsUsd}
                                                    </div>
                                                </div>

                                                <div data-oid="v30maew">
                                                    <label
                                                        className="block text-xs font-medium text-gray-700 mb-1"
                                                        data-oid="ii521mk"
                                                    >
                                                        Rebalance Amount (USD)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={
                                                            vaultRebalanceAmounts[
                                                                position.vault.address
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            handleVaultAmountChange(
                                                                position.vault.address,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        data-oid="phqq2-r"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary and Execute Button */}
                            <div className="border-t border-gray-200 pt-4" data-oid="o-hv7lj">
                                <div
                                    className="flex justify-between items-center mb-4"
                                    data-oid="fz2a9ds"
                                >
                                    <div data-oid="vdj7-6i">
                                        <h4
                                            className="font-medium text-gray-900"
                                            data-oid="djy07s-"
                                        >
                                            Rebalance Summary
                                        </h4>
                                        <p className="text-sm text-gray-600" data-oid="26b56e4">
                                            Vaults with amounts:{' '}
                                            {
                                                Object.entries(vaultRebalanceAmounts).filter(
                                                    ([_, amount]) =>
                                                        amount && parseFloat(amount) > 0,
                                                ).length
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right" data-oid="9wvd8lc">
                                        <div className="text-sm text-gray-600" data-oid="kr1mpzp">
                                            Total Amount
                                        </div>
                                        <div
                                            className="font-semibold text-gray-900"
                                            data-oid="xnmqg03"
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
                                    onClick={handleRebalance}
                                    disabled={
                                        loading ||
                                        Object.entries(vaultRebalanceAmounts).filter(
                                            ([_, amount]) => amount && parseFloat(amount) > 0,
                                        ).length === 0
                                    }
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    data-oid="9uedl76"
                                >
                                    {loading ? 'Processing...' : 'Execute Rebalance'}
                                </button>

                                {transactionStatus && (
                                    <div
                                        className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4"
                                        data-oid="-p344x:"
                                    >
                                        <div className="text-green-800 text-sm" data-oid="e63vhi-">
                                            {transactionStatus}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* API Endpoints Section */}
                <div className="mt-12 bg-white rounded-xl shadow-lg p-8" data-oid="smvm0ov">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6" data-oid="i36te8c">
                        Compass API Endpoints
                    </h3>
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        data-oid="l2mg-ww"
                    >
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="h50-:ac">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="y0jcxci">
                                Vault Operations
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="z95na2:">
                                <li data-oid="9tw_-zn">• Deposit to Vault</li>
                                <li data-oid="lazke_z">• Withdraw from Vault</li>
                                <li data-oid="z77c-bc">• Transaction Bundling</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="2fh9kf1">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="r13bn39">
                                Morpho Integration
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="zec4uy_">
                                <li data-oid="8zg20z5">• Check Vault Position</li>
                                <li data-oid="510-4q5">• Check Market Position</li>
                                <li data-oid="ywax-8_">• Check User Position</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="nhs1gwi">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="nkd6cy4">
                                Features
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="qkc9q1l">
                                <li data-oid="3aftafv">• Real-time Data</li>
                                <li data-oid="rz1czna">• Automated Rebalancing</li>
                                <li data-oid="z:jz3bh">• Gas Optimization</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16" data-oid="qf._3q4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="_9otokv">
                    <div className="text-center text-gray-600" data-oid="nfdg9-f">
                        <p data-oid="6z99491">
                            Powered by Compass Labs API •
                            <a
                                href="https://docs.compasslabs.ai"
                                className="text-blue-600 hover:text-blue-700 ml-1"
                                data-oid="k0h9es."
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
