'use client';

import { useState, useEffect } from 'react';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { MorphoUserPositionRequest } from '@compass-labs/api-sdk/models/operations';
import { MarketPosition } from '@compass-labs/api-sdk/models/components';
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
    const [marketPositions, setMarketPositions] = useState<MarketPosition[]>([]);
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

        setMarketPositions(userPositions.marketPositions);
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
            data-oid="-wuo:5z"
        >
            {/* Header */}
            <header className="bg-white shadow-sm border-b" data-oid="to:uk42">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-oid="dtedsk7">
                    <div className="flex justify-between items-center" data-oid="k0d_nid">
                        <div className="flex items-center space-x-3" data-oid="mm:581f">
                            <div
                                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center"
                                data-oid="phuw.wc"
                            >
                                <span className="text-white font-bold text-sm" data-oid="xp:n0yh">
                                    C
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900" data-oid="ool4-ca">
                                Vault rebalancing
                            </h1>
                        </div>

                        {!isConnected ? (
                            <button
                                onClick={connectWallet}
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                                data-oid="hs5u9ma"
                            >
                                {loading ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3" data-oid="akont.7">
                                <div
                                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                    data-oid="4wje2il"
                                >
                                    Connected
                                </div>
                                <div className="text-sm text-gray-600" data-oid="gb8ekfn">
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="b.md7tf">
                {/* Hero Section */}
                <div className="text-center mb-12" data-oid="qyv8lcf">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4" data-oid=".g5-dof">
                        ERC4626 Vault Rebalancing
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-oid="8f35c47">
                        Showcase the power of Compass API for automated vault rebalancing. Connect
                        your wallet to view positions and execute rebalancing strategies.
                    </p>
                </div>

                {!isConnected ? (
                    /* Welcome State */
                    <div
                        className="bg-white rounded-xl shadow-lg p-8 text-center"
                        data-oid="-uij95r"
                    >
                        <div
                            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                            data-oid="hjholfm"
                        >
                            <svg
                                className="w-8 h-8 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                data-oid="hwwzi1k"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    data-oid="3prcwxa"
                                />
                            </svg>
                        </div>
                        <h3
                            className="text-2xl font-semibold text-gray-900 mb-2"
                            data-oid="nik6wbg"
                        >
                            Connect Your Wallet
                        </h3>
                        <p className="text-gray-600 mb-6" data-oid="umqu8nb">
                            Connect your MetaMask wallet to view your vault positions and start
                            rebalancing
                        </p>
                        <button
                            onClick={connectWallet}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                            data-oid="gngtxtm"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : (
                    /* Connected State */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-oid="euo03fm">
                        {/* Vault Positions */}
                        <div className="bg-white rounded-xl shadow-lg p-6" data-oid="rty7tmm">
                            <h3
                                className="text-xl font-semibold text-gray-900 mb-4"
                                data-oid="6nos7m2"
                            >
                                Vault Positions
                            </h3>
                            {loading && vaultPositions.length === 0 ? (
                                <div
                                    className="flex items-center justify-center py-8"
                                    data-oid="m07csrz"
                                >
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
                                        data-oid="67:yyde"
                                    ></div>
                                    <span className="ml-2 text-gray-600" data-oid="g2fiwa5">
                                        Loading vault positions...
                                    </span>
                                </div>
                            ) : vaultPositions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500" data-oid="q7p2wlq">
                                    <p data-oid="7.4e9n3">No vault positions found</p>
                                </div>
                            ) : (
                                <div className="space-y-4" data-oid="di84i5:">
                                    {vaultPositions.map((position, index) => (
                                        <div
                                            key={position.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                            data-oid="vfcwsdv"
                                        >
                                            <div
                                                className="flex justify-between items-start mb-2"
                                                data-oid="dafctl8"
                                            >
                                                <div data-oid="89b-h-1">
                                                    <div
                                                        className="font-medium text-gray-900"
                                                        data-oid="6s4plxc"
                                                    >
                                                        {position.vault.name}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-500"
                                                        data-oid="68t4_35"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                </div>
                                                <div className="text-right" data-oid="gxlelo-">
                                                    <div
                                                        className="font-semibold text-gray-900"
                                                        data-oid="4ks4.r_"
                                                    >
                                                        ${position.state.assetsUsd}
                                                    </div>
                                                    <div
                                                        className="text-sm text-purple-600"
                                                        data-oid=":5v8sse"
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
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6" data-oid="znfx01:">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4" data-oid="19_7-zc">
                            Rebalance Vaults
                        </h3>

                        <div className="space-y-6" data-oid="j753.wi">
                            {/* Vault Positions List */}
                            <div data-oid="atzz7_4">
                                <h4
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid="fev7n8:"
                                >
                                    Your Vault Positions
                                </h4>
                                {loading && vaultPositions.length === 0 ? (
                                    <div
                                        className="flex items-center justify-center py-8"
                                        data-oid="7qhubn:"
                                    >
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                                            data-oid="4hzwp9w"
                                        ></div>
                                        <span className="ml-2 text-gray-600" data-oid="vrgmoh_">
                                            Loading vault positions...
                                        </span>
                                    </div>
                                ) : vaultPositions.length === 0 ? (
                                    <div
                                        className="text-center py-8 text-gray-500"
                                        data-oid="qw2s2_."
                                    >
                                        <p data-oid="cysnl5y">No vault positions found</p>
                                    </div>
                                ) : (
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                        data-oid="q:ewd8t"
                                    >
                                        {vaultPositions.map((position, index) => (
                                            <div
                                                key={position.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                data-oid="lq9a5c9"
                                            >
                                                <div className="mb-3" data-oid="c0w8c0-">
                                                    <h5
                                                        className="font-medium text-gray-900 text-sm mb-1"
                                                        data-oid="._xr774"
                                                    >
                                                        {position.vault.name}
                                                    </h5>
                                                    <div
                                                        className="text-xs text-gray-500 mb-2"
                                                        data-oid="0l9n-rp"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-600"
                                                        data-oid="x8fqwmg"
                                                    >
                                                        Current Assets: ${position.state.assetsUsd}
                                                    </div>
                                                </div>

                                                <div data-oid="arvb1ep">
                                                    <label
                                                        className="block text-xs font-medium text-gray-700 mb-1"
                                                        data-oid="-49ljmt"
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
                                                        data-oid="a4y0rgi"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary and Execute Button */}
                            <div className="border-t border-gray-200 pt-4" data-oid="a_bef-4">
                                <div
                                    className="flex justify-between items-center mb-4"
                                    data-oid="39vpnva"
                                >
                                    <div data-oid="h5bfq6o">
                                        <h4
                                            className="font-medium text-gray-900"
                                            data-oid=".jc0qp3"
                                        >
                                            Rebalance Summary
                                        </h4>
                                        <p className="text-sm text-gray-600" data-oid="fo7svur">
                                            Vaults with amounts:{' '}
                                            {
                                                Object.entries(vaultRebalanceAmounts).filter(
                                                    ([_, amount]) =>
                                                        amount && parseFloat(amount) > 0,
                                                ).length
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right" data-oid="m_vg2d4">
                                        <div className="text-sm text-gray-600" data-oid="gv2u:i0">
                                            Total Amount
                                        </div>
                                        <div
                                            className="font-semibold text-gray-900"
                                            data-oid="b2qa.4d"
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
                                    data-oid="rps2ms2"
                                >
                                    {loading ? 'Processing...' : 'Execute Rebalance'}
                                </button>

                                {transactionStatus && (
                                    <div
                                        className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4"
                                        data-oid="7t2ets_"
                                    >
                                        <div className="text-green-800 text-sm" data-oid="l2ynbam">
                                            {transactionStatus}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* API Endpoints Section */}
                <div className="mt-12 bg-white rounded-xl shadow-lg p-8" data-oid="p2:87ls">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6" data-oid="ms2-213">
                        Compass API Endpoints
                    </h3>
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        data-oid="d_.htho"
                    >
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="kz1leu7">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="yhzbnjw">
                                Vault Operations
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="so8r4zq">
                                <li data-oid="p9k5ya2">• Deposit to Vault</li>
                                <li data-oid="00sso:w">• Withdraw from Vault</li>
                                <li data-oid="lkx:lby">• Transaction Bundling</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="vns5by9">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="hj6inbv">
                                Morpho Integration
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="na_ei6v">
                                <li data-oid="v95p_a0">• Check Vault Position</li>
                                <li data-oid="d7ofh4c">• Check Market Position</li>
                                <li data-oid=":qdb4ox">• Check User Position</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid=".r9:77o">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="lbbl1hm">
                                Features
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="wl_vc:q">
                                <li data-oid="xo22qg1">• Real-time Data</li>
                                <li data-oid="0g1gwsy">• Automated Rebalancing</li>
                                <li data-oid="oykuype">• Gas Optimization</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16" data-oid="fohfb-l">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="76:t-1v">
                    <div className="text-center text-gray-600" data-oid="v8evloh">
                        <p data-oid="e8j4k9w">
                            Powered by Compass Labs API •
                            <a
                                href="https://docs.compasslabs.ai"
                                className="text-blue-600 hover:text-blue-700 ml-1"
                                data-oid="r2iuudd"
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
