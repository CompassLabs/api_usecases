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
            data-oid="7zvsfgw"
        >
            {/* Header */}
            <header className="bg-white shadow-sm border-b" data-oid=".tvqrdj" key="olk-qaRq">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-oid="75c_350">
                    <div className="flex justify-between items-center" data-oid=".r.3:8w">
                        <div className="flex items-center space-x-3" data-oid="zfisih3">
                            <div
                                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center"
                                data-oid="x3zff3w"
                            >
                                <span className="text-white font-bold text-sm" data-oid="dcbytwt">
                                    C
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900" data-oid="1gtwx:m">
                                Vault rebalancing
                            </h1>
                        </div>

                        {!isConnected ? (
                            <button
                                onClick={connectWallet}
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                                data-oid="sjb6wzm"
                            >
                                {loading ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3" data-oid="ek77n1y">
                                <div
                                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                    data-oid="ol5sn9s"
                                >
                                    Connected
                                </div>
                                <div className="text-sm text-gray-600" data-oid="m7wj08n">
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
                data-oid="cdx3hif"
                key="olk-pnxQ"
            >
                {/* Hero Section */}
                <div className="text-center mb-12" data-oid="o4f0kk8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4" data-oid="ox657y:">
                        ERC4626 Vault Rebalancing
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-oid="9d8_ah_">
                        Showcase the power of Compass API for automated vault rebalancing. Connect
                        your wallet to view positions and execute rebalancing strategies.
                    </p>
                </div>

                {!isConnected ? (
                    /* Welcome State */
                    <div
                        className="bg-white rounded-xl shadow-lg p-8 text-center"
                        data-oid="xammrc0"
                    >
                        <div
                            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                            data-oid="-zlw779"
                        >
                            <svg
                                className="w-8 h-8 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                data-oid="h:o_q:2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    data-oid="4xzm7pu"
                                />
                            </svg>
                        </div>
                        <h3
                            className="text-2xl font-semibold text-gray-900 mb-2"
                            data-oid="u2.558o"
                        >
                            Connect Your Wallet
                        </h3>
                        <p className="text-gray-600 mb-6" data-oid="be:m855">
                            Connect your MetaMask wallet to view your vault positions and start
                            rebalancing
                        </p>
                        <button
                            onClick={connectWallet}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                            data-oid="1n_f25i"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : (
                    /* Connected State */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-oid="k7t1-06">
                        {/* Market Positions */}
                        <div className="bg-white rounded-xl shadow-lg p-6" data-oid="s:vbnly">
                            <h3
                                className="text-xl font-semibold text-gray-900 mb-4"
                                data-oid="g3hvhjt"
                            >
                                Market Positions
                            </h3>
                            {loading && marketPositions.length === 0 ? (
                                <div
                                    className="flex items-center justify-center py-8"
                                    data-oid="mio_083"
                                >
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                                        data-oid="4qn832v"
                                    ></div>
                                    <span className="ml-2 text-gray-600" data-oid="pqt07oy">
                                        Loading market positions...
                                    </span>
                                </div>
                            ) : marketPositions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500" data-oid="dy.u2ui">
                                    <p data-oid="h.q3uw_">No market positions found</p>
                                </div>
                            ) : (
                                <div className="space-y-4" data-oid="_chgpg5">
                                    {marketPositions.map((position, index) => (
                                        <div
                                            key={index}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                            data-oid="s1zi506"
                                        >
                                            <div
                                                className="flex justify-between items-start mb-3"
                                                data-oid=":qt4:z2"
                                            >
                                                <div data-oid="ll43el9">
                                                    <div
                                                        className="font-medium text-gray-900 text-lg"
                                                        data-oid="yri5n6x"
                                                    >
                                                        {position.market.uniqueKey}
                                                    </div>
                                                    <div
                                                        className="flex items-center space-x-4 mt-2"
                                                        data-oid="d:0:_6-"
                                                    >
                                                        {position.healthFactor && (
                                                            <div
                                                                className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded"
                                                                data-oid="9cf40am"
                                                            >
                                                                Health:{' '}
                                                                {parseFloat(
                                                                    position.healthFactor,
                                                                ).toFixed(2)}
                                                            </div>
                                                        )}
                                                        {position.priceVariationToLiquidationPrice && (
                                                            <div
                                                                className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded"
                                                                data-oid="liquidation-price"
                                                            >
                                                                Liquidation:{' '}
                                                                {parseFloat(
                                                                    position.priceVariationToLiquidationPrice,
                                                                ).toFixed(2)}
                                                                %
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right" data-oid="o1yxqs.">
                                                    <div
                                                        className={`font-semibold text-lg ${
                                                            parseFloat(position.state.pnlUsd) >= 0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }`}
                                                        data-oid="52x:19i"
                                                    >
                                                        $
                                                        {parseFloat(position.state.pnlUsd).toFixed(
                                                            2,
                                                        )}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-500"
                                                        data-oid="df8ufc9"
                                                    >
                                                        PnL USD
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Supply and Borrow Information */}
                                            <div
                                                className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100"
                                                data-oid="mgconj4"
                                            >
                                                {/* Supply Section */}
                                                <div data-oid="plsp3.w">
                                                    <h4
                                                        className="font-medium text-gray-700 mb-2 text-sm"
                                                        data-oid="weyim66"
                                                    >
                                                        Supply
                                                    </h4>
                                                    <div className="space-y-1" data-oid="r-_..1z">
                                                        <div
                                                            className="flex justify-between text-sm"
                                                            data-oid="g9.gxpv"
                                                        >
                                                            <span
                                                                className="text-gray-600"
                                                                data-oid="hhcofii"
                                                            >
                                                                Assets:
                                                            </span>
                                                            <span
                                                                className="font-medium"
                                                                data-oid="tc6ymhh"
                                                            >
                                                                {parseFloat(
                                                                    position.state.supplyAssets,
                                                                ).toFixed(4)}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="flex justify-between text-sm"
                                                            data-oid="a-v9vt-"
                                                        >
                                                            <span
                                                                className="text-gray-600"
                                                                data-oid="buw9n9a"
                                                            >
                                                                Shares:
                                                            </span>
                                                            <span
                                                                className="font-medium"
                                                                data-oid="-_g6xux"
                                                            >
                                                                {parseFloat(
                                                                    position.state.supplyShares,
                                                                ).toFixed(4)}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="flex justify-between text-sm"
                                                            data-oid="xtmntf7"
                                                        >
                                                            <span
                                                                className="text-gray-600"
                                                                data-oid="8g.5895"
                                                            >
                                                                USD Value:
                                                            </span>
                                                            <span
                                                                className="font-medium"
                                                                data-oid="-_l57sj"
                                                            >
                                                                $
                                                                {parseFloat(
                                                                    position.state.supplyAssetsUsd,
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Borrow Section */}
                                                <div data-oid="uzmk9ei">
                                                    <h4
                                                        className="font-medium text-gray-700 mb-2 text-sm"
                                                        data-oid="2rx9ck7"
                                                    >
                                                        Borrow
                                                    </h4>
                                                    <div className="space-y-1" data-oid="ovmqon_">
                                                        <div
                                                            className="flex justify-between text-sm"
                                                            data-oid="hyeqy8b"
                                                        >
                                                            <span
                                                                className="text-gray-600"
                                                                data-oid="1tujw6s"
                                                            >
                                                                Assets:
                                                            </span>
                                                            <span
                                                                className="font-medium"
                                                                data-oid="n95otfy"
                                                            >
                                                                {parseFloat(
                                                                    position.state.borrowAssets,
                                                                ).toFixed(4)}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="flex justify-between text-sm"
                                                            data-oid="46fkanu"
                                                        >
                                                            <span
                                                                className="text-gray-600"
                                                                data-oid="fohlc:h"
                                                            >
                                                                Shares:
                                                            </span>
                                                            <span
                                                                className="font-medium"
                                                                data-oid="2mm6oyj"
                                                            >
                                                                {parseFloat(
                                                                    position.state.borrowShares,
                                                                ).toFixed(4)}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="flex justify-between text-sm"
                                                            data-oid="17.fdmf"
                                                        >
                                                            <span
                                                                className="text-gray-600"
                                                                data-oid="_99rfuk"
                                                            >
                                                                USD Value:
                                                            </span>
                                                            <span
                                                                className="font-medium"
                                                                data-oid="35-lw1_"
                                                            >
                                                                $
                                                                {parseFloat(
                                                                    position.state.borrowAssetsUsd,
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Collateral Information */}
                                            <div
                                                className="mt-4 pt-4 border-t border-gray-100"
                                                data-oid="pfful_t"
                                            >
                                                <h4
                                                    className="font-medium text-gray-700 mb-2 text-sm"
                                                    data-oid="8iacrcc"
                                                >
                                                    Collateral
                                                </h4>
                                                <div
                                                    className="flex justify-between text-sm"
                                                    data-oid="bff5tvq"
                                                >
                                                    <span
                                                        className="text-gray-600"
                                                        data-oid="syo5e:e"
                                                    >
                                                        Amount:
                                                    </span>
                                                    <span
                                                        className="font-medium"
                                                        data-oid="dzmeb4y"
                                                    >
                                                        {parseFloat(
                                                            position.state.collateral,
                                                        ).toFixed(4)}
                                                    </span>
                                                </div>
                                                <div
                                                    className="flex justify-between text-sm"
                                                    data-oid=":fkhp60"
                                                >
                                                    <span
                                                        className="text-gray-600"
                                                        data-oid="hekm43e"
                                                    >
                                                        USD Value:
                                                    </span>
                                                    <span
                                                        className="font-medium"
                                                        data-oid="c76n-t6"
                                                    >
                                                        $
                                                        {parseFloat(
                                                            position.state.collateralUsd,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Vault Positions */}
                        <div className="bg-white rounded-xl shadow-lg p-6" data-oid="ne_5sra">
                            <h3
                                className="text-xl font-semibold text-gray-900 mb-4"
                                data-oid="jfsbagp"
                            >
                                Vault Positions
                            </h3>
                            {loading && vaultPositions.length === 0 ? (
                                <div
                                    className="flex items-center justify-center py-8"
                                    data-oid="i3wn-gx"
                                >
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
                                        data-oid=":sv2-ac"
                                    ></div>
                                    <span className="ml-2 text-gray-600" data-oid="47vsb5x">
                                        Loading vault positions...
                                    </span>
                                </div>
                            ) : vaultPositions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500" data-oid="_ktd44k">
                                    <p data-oid="_7.u1u8">No vault positions found</p>
                                </div>
                            ) : (
                                <div className="space-y-4" data-oid="t95rh2e">
                                    {vaultPositions.map((position, index) => (
                                        <div
                                            key={position.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                            data-oid="-j:91el"
                                        >
                                            <div
                                                className="flex justify-between items-start mb-2"
                                                data-oid="-xui97c"
                                            >
                                                <div data-oid="81s2c7s">
                                                    <div
                                                        className="font-medium text-gray-900"
                                                        data-oid="so0j_in"
                                                    >
                                                        {position.vault.name}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-500"
                                                        data-oid="poqpux5"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                </div>
                                                <div className="text-right" data-oid="1m..:2f">
                                                    <div
                                                        className="font-semibold text-gray-900"
                                                        data-oid="dkbs0q2"
                                                    >
                                                        ${position.state.assetsUsd}
                                                    </div>
                                                    <div
                                                        className="text-sm text-purple-600"
                                                        data-oid="3xrgpku"
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
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6" data-oid="-w8i2eq">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4" data-oid="b5yb8yw">
                            Rebalance Vaults
                        </h3>

                        <div className="space-y-6" data-oid="7jz9k1m">
                            {/* Vault Positions List */}
                            <div data-oid="un50c81">
                                <h4
                                    className="text-lg font-medium text-gray-900 mb-4"
                                    data-oid="j0ac-dr"
                                >
                                    Your Vault Positions
                                </h4>
                                {loading && vaultPositions.length === 0 ? (
                                    <div
                                        className="flex items-center justify-center py-8"
                                        data-oid="b.ohx0h"
                                    >
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                                            data-oid="8d59i4_"
                                        ></div>
                                        <span className="ml-2 text-gray-600" data-oid="ci62gke">
                                            Loading vault positions...
                                        </span>
                                    </div>
                                ) : vaultPositions.length === 0 ? (
                                    <div
                                        className="text-center py-8 text-gray-500"
                                        data-oid="n55jpuu"
                                    >
                                        <p data-oid="mo5wc1z">No vault positions found</p>
                                    </div>
                                ) : (
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                        data-oid="yzcd.57"
                                    >
                                        {vaultPositions.map((position, index) => (
                                            <div
                                                key={position.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                data-oid="pt5pmrs"
                                            >
                                                <div className="mb-3" data-oid="9y0sxzb">
                                                    <h5
                                                        className="font-medium text-gray-900 text-sm mb-1"
                                                        data-oid="kysrwc3"
                                                    >
                                                        {position.vault.name}
                                                    </h5>
                                                    <div
                                                        className="text-xs text-gray-500 mb-2"
                                                        data-oid="bouyr8t"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-600"
                                                        data-oid="d3i43-3"
                                                    >
                                                        Current Assets: ${position.state.assetsUsd}
                                                    </div>
                                                </div>

                                                <div data-oid="26c1k1d">
                                                    <label
                                                        className="block text-xs font-medium text-gray-700 mb-1"
                                                        data-oid="62xk9mk"
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
                                                        data-oid="af3.czx"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary and Execute Button */}
                            <div className="border-t border-gray-200 pt-4" data-oid="k3r6bjn">
                                <div
                                    className="flex justify-between items-center mb-4"
                                    data-oid="m1eit3o"
                                >
                                    <div data-oid="rf6o9nu">
                                        <h4
                                            className="font-medium text-gray-900"
                                            data-oid="5byd3jf"
                                        >
                                            Rebalance Summary
                                        </h4>
                                        <p className="text-sm text-gray-600" data-oid="2fft-ur">
                                            Vaults with amounts:{' '}
                                            {
                                                Object.entries(vaultRebalanceAmounts).filter(
                                                    ([_, amount]) =>
                                                        amount && parseFloat(amount) > 0,
                                                ).length
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right" data-oid="gn-9g6l">
                                        <div className="text-sm text-gray-600" data-oid="03d1rhh">
                                            Total Amount
                                        </div>
                                        <div
                                            className="font-semibold text-gray-900"
                                            data-oid="di1t20q"
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
                                    data-oid="wxqglct"
                                >
                                    {loading ? 'Processing...' : 'Execute Rebalance'}
                                </button>

                                {transactionStatus && (
                                    <div
                                        className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4"
                                        data-oid=".xb.dq:"
                                    >
                                        <div className="text-green-800 text-sm" data-oid="9-fml.6">
                                            {transactionStatus}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* API Endpoints Section */}
                <div className="mt-12 bg-white rounded-xl shadow-lg p-8" data-oid="x0o835b">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6" data-oid="pe3mjz0">
                        Compass API Endpoints
                    </h3>
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        data-oid="vjsod_p"
                    >
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="f0.xw5.">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="91qj7xa">
                                Vault Operations
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="39xpa21">
                                <li data-oid="zs568i:">• Deposit to Vault</li>
                                <li data-oid="s5:yl.8">• Withdraw from Vault</li>
                                <li data-oid="tin620v">• Transaction Bundling</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="lrsljky">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="-lk37tx">
                                Morpho Integration
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="t86_7v8">
                                <li data-oid="6n.l16j">• Check Vault Position</li>
                                <li data-oid="va90esw">• Check Market Position</li>
                                <li data-oid="8j2q0z2">• Check User Position</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="eaw36rl">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="iq7mq6w">
                                Features
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="glle.70">
                                <li data-oid="u2_lhfv">• Real-time Data</li>
                                <li data-oid="o5gg9th">• Automated Rebalancing</li>
                                <li data-oid="-po0slu">• Gas Optimization</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16" data-oid="k-agqtz" key="olk-7o4M">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="kn3t3d1">
                    <div className="text-center text-gray-600" data-oid="5vfio0d">
                        <p data-oid="__ry0:.">
                            Powered by Compass Labs API •
                            <a
                                href="https://docs.compasslabs.ai"
                                className="text-blue-600 hover:text-blue-700 ml-1"
                                data-oid="bbltfy8"
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
