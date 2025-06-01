'use client';

import React, { useState, useEffect } from "react";
import { requestSupplyTransaction, SupplyApiResponse } from "@/lib/supplyApi";

import { getAaveTokenBalance } from "@/lib/readAaveBalance";
import { getTokenBalance } from "@/lib/readTokenBalance";

import { parseSignature, SignedAuthorization, authorize } from "@/lib/authorize";
import {
  TokenEnum,
} from "@compass-labs/api-sdk/models/components";

import { ethers } from 'ethers';



type Asset = {
  symbol: TokenEnum;
  balance: number;
};

const mockAssets: Asset[] = [
  { symbol: TokenEnum.Wbtc, balance: 0.523 },
  { symbol: TokenEnum.Weth, balance: 12.33 },
  { symbol: TokenEnum.Usdc, balance: 1300 },
];



const getEthereumProvider = (): EthereumProvider => {
  if (!window.ethereum) {
    throw new Error("No wallet found");
  }
  return window.ethereum;
};

export default function Wallet() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [balances, setBalances] = useState(() => new Map<TokenEnum, string>());



  // Load wallet address once on mount
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const ethereum = getEthereumProvider();
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(ethers.getAddress(accounts[0]));
        console.log("Wallet connected:", accounts[0]);
      } catch (err) {
        alert("Could not connect to ethereum wallet");
        throw new Error("Could not connect to ethereum wallet");
      }
    };

    fetchAddress();
  }, []);


  useEffect(() => {

    const fetchBalances = async () => {
      const balancesMap = new Map<TokenEnum, string>();
      for (const asset of mockAssets) {
        try {
          const balance = await getTokenBalance(asset.symbol, walletAddress);
          balancesMap.set(asset.symbol, balance.toString());
        } catch (err) {
          console.error(`Failed to fetch balance for ${asset.symbol}:`, err);
          balancesMap.set(asset.symbol, "Error");
        }
      }
      setBalances(balancesMap);
    }
    if (walletAddress){
      fetchBalances();
    }
    
  }, [walletAddress]);

  const handleSupply = async (asset: Asset, amount: number) => {
    try {
      console.log(`Calling external API for ${asset.symbol}`);
      const ethereum = getEthereumProvider();

      const authorization = await authorize(walletAddress);

      console.log(authorization);
      // Convert object to string for signing
      const message = JSON.stringify(authorization);

      // Get the current wallet address
      const accounts = await ethereum.request({
        method: "eth_requestAccounts"
      });
      const address = accounts[0];
      // Call personal_sign
      const signature = await ethereum.request({
        method: "personal_sign",
        params: [message, address]
      });
      console.log("singature from metamask:", signature);

      const signedAuth = await parseSignature(
        signature,
        5,  // nonce
        "0xcA11bde05977b3631167028862bE2a173976CA11",  // address of multicall contract
        1   // chainId
      );

      console.log(signedAuth);


      const data = await requestSupplyTransaction(amount, asset.symbol, walletAddress, signedAuth);
      console.log("data", data);


      // Send transaction request to wallet
      const txParams = {
        from: walletAddress,
        to: data.to,
        value: data.value,
        data: data.data,
        gas: data.gas,
      };



      const txHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      console.log("Transaction hash:", txHash);
    } catch (err) {
      console.error("Supply failed:", err);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 400, margin: "0 auto", padding: 20 }}>
      <h1>My Crypto Wallet</h1>
      <h2>Address: ${walletAddress}</h2>

      <div style={{ marginTop: 30 }}>
        <h3>Assets</h3>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {mockAssets.map((asset) => (
            <li key={asset.symbol} style={{ marginBottom: 20 }}>
              <div>
                <strong>{asset.symbol}</strong> {balances.get(asset.symbol)}
                <button
                  onClick={() => handleSupply(asset,Number(balances.get(asset.symbol)))  }
                  style={{ padding: "5px 10px", marginTop: 5 }}
                >
                  Supply to AAVE
                </button>
              </div>

            </li>
          ))}
        </ul>
      </div>

      <button style={{ padding: "10px 20px", marginTop: 20 }}>Send</button>
    </div>
  );
}
