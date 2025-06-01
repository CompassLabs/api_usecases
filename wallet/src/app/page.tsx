'use client';

import React, { useState, useEffect } from "react";
import { requestSupplyTransaction, SupplyApiResponse } from "@/lib/supplyApi";
import { getAaveTokenBalance } from "@/lib/readAaveBalance";
import { getTokenBalance } from "@/lib/readTokenBalance";
import { parseSignature, SignedAuthorization, authorize } from "@/lib/authorize";
import { TokenEnum } from "@compass-labs/api-sdk/models/components";
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
  const [balancesAAVE, setBalancesAAVE] = useState(() => new Map<TokenEnum, string>());

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
      const balancesMapAAVE = new Map<TokenEnum, string>();
      for (const asset of mockAssets) {
        try {
          const balance = await getTokenBalance(asset.symbol, walletAddress);
          const balanceAAVE = await getAaveTokenBalance(asset.symbol, walletAddress);
          balancesMap.set(asset.symbol, balance.toString());
          balancesMapAAVE.set(asset.symbol, balanceAAVE.toString());
        } catch (err) {
          console.error(`Failed to fetch balance for ${asset.symbol}:`, err);
          balancesMap.set(asset.symbol, "Error");
        }
      }
      setBalances(balancesMap);
      setBalancesAAVE(balancesMapAAVE);
    }
    if (walletAddress) {
      fetchBalances();
    }
  }, [walletAddress]);

  const handleSupply = async (asset: Asset, amount: number) => {
    try {
      console.log(`Calling external API for ${asset.symbol}`);
      const ethereum = getEthereumProvider();

      const authorization = await authorize(walletAddress);
      const message = JSON.stringify(authorization);
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];

      const signature = await ethereum.request({
        method: "personal_sign",
        params: [message, address]
      });
      console.log("signature from metamask:", signature);

      const signedAuth = await parseSignature(
        signature, 5, "0xcA11bde05977b3631167028862bE2a173976CA11", 1
      );

      const data = await requestSupplyTransaction(amount, asset.symbol, walletAddress, signedAuth);
      console.log("data", data);

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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md font-sans">
      <h1 className="text-2xl font-bold mb-4 text-center">My Crypto Wallet</h1>
      <h2 className="text-sm text-gray-600 break-all mb-6">
        Address: {walletAddress ? walletAddress : "Not connected"}
      </h2>

      <div>
        <h3 className="text-lg font-semibold mb-3">Wallet</h3>
        <ul className="space-y-4">
          {mockAssets.map((asset) => (
            <li key={asset.symbol} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium">{asset.symbol}</div>
                <div className="text-gray-500">{balances.get(asset.symbol)}</div>
              </div>
              <button
                onClick={() => handleSupply(asset, Number(balances.get(asset.symbol)))}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                Supply
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 mt-20">AAVE</h3>
        <ul className="space-y-4">
          {mockAssets.map((asset) => (
            <li key={asset.symbol} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium">{asset.symbol}</div>
                <div className="text-gray-500">{balancesAAVE.get(asset.symbol)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
