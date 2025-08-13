'use client';

import {usePrivy, useSendTransaction, useWallets, useSign7702Authorization, useCreateWallet, ConnectedWallet} from '@privy-io/react-auth';
import {CompassApiSDK} from '@compass-labs/api-sdk';
import { useEffect, useState } from 'react';
import {createWalletClient, custom, Hex, SignedAuthorization, TransactionRequest} from 'viem';
import {base, alchemy, mainnet} from '@account-kit/infra';
import {AuthorizationRequest, SmartAccountSigner, WalletClientSigner} from '@aa-sdk/core';
import { useSmartAccountClient } from "@account-kit/react";


const sdk = new CompassApiSDK({
  apiKeyAuth: process.env.NEXT_PUBLIC_COMPASS_API_KEY!
});

export default function Home() {
  const {ready, authenticated, user, login, logout} = usePrivy();
  const {createWallet} = useCreateWallet({
        onSuccess: ({wallet}) => {
            console.log('Created privyWallet ', wallet);
        },
        onError: (error) => {
            console.error('Failed to create privyWallet with error ', error)
        }
    })
  const {signAuthorization} = useSign7702Authorization();
  const {sendTransaction} = useSendTransaction();
  const [privyWallet, setPrivyWallet] = useState<ConnectedWallet | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const {wallets, ready: walletsReady} = useWallets();
  console.log("wallets", wallets);
  console.log("walletsReady", walletsReady);
  
//   async function create7702Signer(){
//     const baseSigner = new WalletClientSigner(createWalletClient({
//         chain: base,
//         account: privyWallet?.address as Hex,
//         transport: custom(await wallets[0].getethereumProvider()),
//     }), 'privy');

//     const signer: SmartAccountSigner = {
//         signerType: 'privy',
//         getAddress: baseSigner.getAddress,
//         signMessage: baseSigner.signMessage,
//         signTypedData: baseSigner.signTypedData,
//         inner: baseSigner.inner,
//         signAuthorization: async (unsignedAuthorization: AuthorizationRequest<number>) => {
//             const signedAuth = await signAuthorization({
//                 contractAddress: unsignedAuthorization.address as `0x${string}`,
//                 chainId: unsignedAuthorization.chainId,
//                 nonce: unsignedAuthorization.nonce,
//             });

//             return {
//                 address: unsignedAuthorization.address,
//                 chainId: unsignedAuthorization.chainId,
//                 nonce: unsignedAuthorization.nonce,
//                 r: signedAuth.r,
//                 s: signedAuth.s,
//                 v: signedAuth.v || 0,
//                 yParity: signedAuth.yParity,
//             } as SignedAuthorization<number>
//         }
//     }
//     return signer;
//   }
  

  const makeWallet = async () => {
    console.log('Creating privyWallet');
    const w = await createWallet();
    
    console.log(w);
  }
  
  useEffect(() => {
    if (walletsReady && wallets.length > 1) {
        wallets[0].switchChain(42161);
        setWallet(wallets[1]);
        wallets[1].switchChain(42161);
        setPrivyWallet(wallets[0]);
        console.log("wallets", wallets);
    }
  }, [walletsReady]);

  const aave_supply = async () => {
    const auth = await sdk.transactionBundler.bundlerAuthorization({
        chain: "base:mainnet",
        sender: privyWallet?.address as string,
      });

    console.log(auth);

    const signedAuth = await signAuthorization({
        contractAddress: auth.address as `0x${string}`,
        chainId: auth.chainId,
        nonce: auth.nonce,
    }, {
        address: privyWallet?.address as string,
    });

    console.log(signedAuth);
    
    const tx = await sdk.transactionBundler.bundlerExecute({
        chain: "base:mainnet",
        sender: privyWallet?.address as string,
        signedAuthorization: signedAuth,
        actions: [
            {
                body: {
                    actionType: "SET_ALLOWANCE",
                    token: "USDC",
                    contract: "AaveV3Pool",
                    amount: "1000",
                },
            },
            {
                body: {
                    actionType: "AAVE_SUPPLY",
                    token: "USDC",
                    amount: "1"
                },
            }
        ],
    });

    console.log(tx);



    // const txHash = await walletClient.sendTransaction(tx as unknown as TransactionRequest);
    const txHash = await sendTransaction(tx);
    console.log(txHash);
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Privy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Privy Wallet Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect your privyWallet or create an embedded privyWallet to get started with Privy authentication
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!authenticated && !privyWallet ? (
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Welcome to Privy
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Sign in to access your privyWallet and start using the app
                  </p>
                </div>
                
                <button
                  onClick={login}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div>
                {/* User Info */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Welcome back!
                      </h2>
                      <p className="text-gray-600">
                        User ID: <span className="font-mono text-sm">{user?.id}</span>
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Authentication Method</h3>
                    <p className="text-gray-600">
                      {user?.linkedAccounts?.map(account => account.type).join(', ') || 'Unknown'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Account Created</h3>
                    <p className="text-gray-600">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>

                

                {/* Wallets Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Connected Wallets</h3>
                  {privyWallet ? (
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {privyWallet.walletClientType === 'privy' ? 'Embedded Wallet' : 'External Wallet'}
                                </p>
                                <p className="text-sm text-gray-600 font-mono">
                                  {privyWallet.address}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Connected
                            </span>
                          </div>
                        </div>
                    </div>
                  ) : (
                    
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-gray-600 mb-4">No wallets connected</p>
                      <button
                        onClick={makeWallet}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create Embedded Wallet</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* AAVE Supply Section */}
                {privyWallet && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">AAVE Operations</h3>
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Supply to AAVE</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Supply 1 USDC to AAVE on Base network to earn interest
                          </p>
                          <p className="text-xs text-gray-500">
                            This will set allowance and supply tokens in a single transaction
                          </p>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-500">1 USDC</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={aave_supply}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        <span>Supply 1 USDC to AAVE</span>
                      </button>
                      
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        Network: Base • Token: USDC • Amount: 1 USDC
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <div className="flex justify-center space-x-6">
              <a
                href="https://docs.privy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Privy Documentation
              </a>
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Next.js Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}