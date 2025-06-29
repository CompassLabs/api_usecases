'use client';

import { useState, useEffect } from 'react';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { MorphoUserPositionRequest } from '@compass-labs/api-sdk/models/operations';
import {
    SetAllowanceParams,
    UserOperation,
    VaultPosition,
} from '@compass-labs/api-sdk/models/components';
import { getAddress } from 'viem';
import { MorphoDepositParams, MorphoWithdrawParams } from '@compass-labs/api-sdk/models/components';
import { toBeHex } from 'ethers';

const compassApiSDK = new CompassApiSDK({
    apiKeyAuth: process.env.COMPASS_API_KEY,
    serverURL: 'http://localhost:8000',
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
    const [vaultPositions, setVaultPositions] = useState<VaultPosition[]>([]);
    const [loading, setLoading] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState('');
    const [vaultRebalanceAmounts, setVaultRebalanceAmounts] = useState<{ [key: string]: string }>(
        {},
    );

    const getUserPositions = async (address: string) => {
        const userPositions = await compassApiSDK.morpho.userPosition({
            chain: 'base:mainnet',
            userAddress: address,
        } as MorphoUserPositionRequest);

        setVaultPositions(userPositions.vaultPositions);
    };

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                setLoading(true);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const checksumAddress = getAddress(accounts[0]);
                setWalletAddress(checksumAddress);
                setIsConnected(true);
                
                // Switch to Base network
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x2105' }], // Base mainnet chainId
                    });
                } catch (switchError: any) {
                    // This error code indicates that the chain has not been added to MetaMask
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x2105',
                                    chainName: 'Base',
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://mainnet.base.org'],
                                    blockExplorerUrls: ['https://basescan.org']
                                }]
                            });
                        } catch (addError) {
                            console.error('Failed to add Base network:', addError);
                        }
                    }
                }
                
                // Simulate fetching user positions
                setTimeout(async () => {
                    await getUserPositions(checksumAddress);
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
        // await publicClient.transport.request({
        //     method: 'anvil_setBalance' as any,
        //     params: ['0xa829B388A3DF7f581cE957a95edbe419dd146d1B', '0x56BC75E2D63100000'], // 100 ETH in wei
        // });
    };
    const handleRebalance = async () => {
        console.log(vaultRebalanceAmounts);
        console.log(vaultPositions);
        let vault_actions: UserOperation[] = [];
        let totalAmount = 0;
        for (const vault of vaultPositions) {
            const amountBefore = Number(vault.state.assets) / 10 ** vault.vault.asset.decimals;
            totalAmount += Number(amountBefore);
        } // Add allowance operations at the beginning
        for (const vault of vaultPositions) {
            vault_actions.push({
                body: {
                    actionType: 'SET_ALLOWANCE',
                    token: vault.vault.asset.address,
                    contract: vault.vault.address,
                    amount: totalAmount * 10,
                } as SetAllowanceParams,
            } as UserOperation);
        }
        let totalRebalanceAmount = 0;

        // Then add withdraw and deposit operations
        for (const vault of vaultPositions) {
            const vaultAddress = vault.vault.address;

            vault_actions.push({
                body: {
                    actionType: 'MORPHO_WITHDRAW',
                    vaultAddress: vaultAddress,
                    amount: 'ALL',
                    receiver: vaultAddress,
                } as MorphoWithdrawParams,
            } as UserOperation);

            const rebalanceAmount = Number(vaultRebalanceAmounts[vaultAddress]);
            if (rebalanceAmount > 0) {
                vault_actions.push({
                    body: {
                        actionType: 'MORPHO_DEPOSIT',
                        vaultAddress: vaultAddress,
                        amount: rebalanceAmount,
                        receiver: walletAddress,
                    } as MorphoDepositParams,
                } as UserOperation);
            }

            totalRebalanceAmount += Number(vaultRebalanceAmounts[vaultAddress]);
        }

        if (totalRebalanceAmount > totalAmount) {
            alert('Total rebalance amount is greater than total amount');
            return;
        }

        const auth = await compassApiSDK.transactionBundler.bundlerAuthorization({
            chain: 'base:mainnet',
            sender: walletAddress,
        });

        const message = `Sign this message to authorize the transaction bundler.\n\nContract: ${auth.address}\nNonce: ${auth.nonce}`;

        const signature = await window.ethereum?.request({
            method: 'personal_sign',
            params: [message, walletAddress],
        });

        // Parse the signature
        const r = signature.slice(0, 66);
        const s = '0x' + signature.slice(66, 130);
        const v = parseInt(signature.slice(130, 132), 16);
        const yParity = v === 27 ? 0 : 1;

        console.log(vault_actions);

        const bundleTx = await compassApiSDK.transactionBundler.bundlerExecute({
            chain: 'base:mainnet',
            sender: walletAddress,
            actions: vault_actions,
            signedAuthorization: {
                nonce: auth.nonce,
                address: auth.address,
                chainId: auth.chainId,
                r: r,
                s: s,
                yParity: yParity,
            },
        });
        // Send transaction via MetaMask
        if (typeof window.ethereum !== 'undefined') {
            try {
                console.log(bundleTx);
                // Add the v property to the authorization list object
                const modifiedAuthorizationList = bundleTx.authorizationList?.map((authObj: any) => ({
                    ...authObj,
                    v: v
                })) || [];
                console.log(modifiedAuthorizationList);
                const txParams = {
                    from: walletAddress,
                    to: bundleTx.to,
                    value: toBeHex(bundleTx.value),
                    data: bundleTx.data,
                    gas: toBeHex(bundleTx.gas),
                    authorizationList: modifiedAuthorizationList,
                    nonce: toBeHex(bundleTx.nonce),
                };
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [txParams],
                });
                setTransactionStatus(`Transaction submitted! Hash: ${txHash}`);
            } catch (error) {
                console.error('Transaction failed:', error);
                setTransactionStatus('Transaction failed. Please try again.');
            }
        } else {
            console.error('MetaMask not found');
            setTransactionStatus('MetaMask not found. Please install MetaMask.');
        }
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
                                onClick={connectWallet}
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
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-oid="e5epmo_">
                {/* Hero Section */}
                <div className="text-center mb-12" data-oid="fm3m4_7">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4" data-oid="b78izdb">
                        ERC4626 Vault Rebalancing
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-oid="2d7kw2g">
                        Showcase the power of Compass API for automated vault rebalancing. Connect
                        your wallet to view positions and execute rebalancing strategies.
                    </p>
                </div>

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
                            Connect your MetaMask wallet to view your vault positions and start
                            rebalancing
                        </p>
                        <button
                            onClick={connectWallet}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                            data-oid="zlj2rd2"
                        >
                            Connect MetaMask
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
                            {loading && vaultPositions.length === 0 ? (
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
                            ) : vaultPositions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500" data-oid="z0nbbt0">
                                    <p data-oid="mz2ambw">No vault positions found</p>
                                </div>
                            ) : (
                                <div className="space-y-4" data-oid=":qw4d99">
                                    {vaultPositions.map((position, index) => (
                                        <div
                                            key={position.id}
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
                                                        {position.vault.name}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-500"
                                                        data-oid="tgut7da"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                </div>
                                                <div className="text-right" data-oid="3man7uk">
                                                    <div
                                                        className="font-semibold text-gray-900"
                                                        data-oid="3s.n7pf"
                                                    >
                                                        ${position.vault.asset.symbol}
                                                    </div>
                                                    <div
                                                        className="text-sm text-gray-600"
                                                        data-oid="tk88a_j"
                                                    >
                                                        $
                                                        {(
                                                            Number(position.state.assets) /
                                                            10 ** position.vault.asset.decimals
                                                        ).toFixed(5)}
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
                                {loading && vaultPositions.length === 0 ? (
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
                                ) : vaultPositions.length === 0 ? (
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
                                        {vaultPositions.map((position, index) => (
                                            <div
                                                key={position.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                data-oid="grh0hvq"
                                            >
                                                <div className="mb-3" data-oid="y9hwolr">
                                                    <h5
                                                        className="font-medium text-gray-900 text-sm mb-1"
                                                        data-oid="k3ub5fk"
                                                    >
                                                        {position.vault.name}
                                                    </h5>
                                                    <div
                                                        className="text-xs text-gray-500 mb-2"
                                                        data-oid="wg__4a:"
                                                    >
                                                        {position.vault.address.slice(0, 6)}...
                                                        {position.vault.address.slice(-4)}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-600"
                                                        data-oid="zmrk8ad"
                                                    >
                                                        Current Assets: ${position.state.assetsUsd}
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
                                    onClick={handleRebalance}
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

                {/* API Endpoints Section */}
                <div className="mt-12 bg-white rounded-xl shadow-lg p-8" data-oid="rdc_xcz">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6" data-oid="ft:x1me">
                        Compass API Endpoints
                    </h3>
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        data-oid="60rv:41"
                    >
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="th89v8n">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="n025b.x">
                                Vault Operations
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="_j34mer">
                                <li data-oid="pniousv">• Deposit to Vault</li>
                                <li data-oid="rb8ew6e">• Withdraw from Vault</li>
                                <li data-oid="odfb-yo">• Transaction Bundling</li>
                                <li data-oid="uniswap1">• Swap</li>
                                <li data-oid="uniswap2">• Liquidity Provision</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="u::qw95">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="vh0-bwc">
                                Morpho Integration
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid=".q8rra4">
                                <li data-oid="h7el.i5">• Check Vault Position</li>
                                <li data-oid="pd3ypf4">• Check Market Position</li>
                                <li data-oid="9bcfx99">• Check User Position</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4" data-oid="ws0.5xn">
                            <h4 className="font-semibold text-gray-900 mb-2" data-oid="l8d230u">
                                Features
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1" data-oid="vgx-5do">
                                <li data-oid="xo0wm:f">• Real-time Data</li>
                                <li data-oid="5ow9hcf">• Automated Rebalancing</li>
                                <li data-oid="kyfmwhs">• Gas Optimization</li>
                            </ul>
                        </div>
                    </div>
                </div>
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
