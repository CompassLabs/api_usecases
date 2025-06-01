'use client';

import React from "react";

type Asset = {
  symbol: string;
  name: string;
  balance: number;
};

const mockAssets: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", balance: 0.523 },
  { symbol: "ETH", name: "Ethereum", balance: 12.33 },
  { symbol: "USDC", name: "USD Coin", balance: 1300 },
];

// Type for the external API response
type SupplyApiResponse = {
  tx: {
    to: string;
    value: string;
    data: string;
    gas?: string;
  };
};

export default function Wallet() {
  const totalBalanceUSD = 45000; // mock total balance

  const handleSupply = async (asset: Asset) => {
    try {
      console.log(`Calling external API for ${asset.symbol}`);

      const response = await fetch("https://api.example.com/supply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: asset.symbol,
          amount: asset.balance,
          userAddress: await getWalletAddress(),
        }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data: SupplyApiResponse = await response.json();

      // Send transaction request to wallet
      const txParams = {
        from: await getWalletAddress(),
        to: data.tx.to,
        value: data.tx.value,
        data: data.tx.data,
        gas: data.tx.gas,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      console.log("Transaction hash:", txHash);
    } catch (err) {
      console.error("Supply failed:", err);
    }
  };

  const getWalletAddress = async (): Promise<string> => {
    if (!window.ethereum) {
      throw new Error("No wallet found");
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
  };

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 400, margin: "0 auto", padding: 20 }}>
      <h1>My Crypto Wallet</h1>
      <h2>Total Balance: ${totalBalanceUSD.toLocaleString()}</h2>

      <div style={{ marginTop: 30 }}>
        <h3>Assets</h3>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {mockAssets.map((asset) => (
            <li key={asset.symbol} style={{ marginBottom: 20 }}>
              <div>
                <strong>{asset.symbol}</strong> ({asset.name}): {asset.balance}
              </div>
              <button
                onClick={() => handleSupply(asset)}
                style={{ padding: "5px 10px", marginTop: 5 }}
              >
                Supply
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button style={{ padding: "10px 20px", marginTop: 20 }}>Send</button>
    </div>
  );
}
