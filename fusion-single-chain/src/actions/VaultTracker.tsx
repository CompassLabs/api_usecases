import { useState } from 'react';
import { CompassApiSDK } from '@compass-labs/api-sdk';
import { addVaultForTracking } from './addVaultForTracking';
import type { VaultForTracking } from './addVaultForTracking';

interface VaultTrackerProps {
  compassApiSDK: CompassApiSDK;
  vaults: VaultForTracking[];
  setVaults: (vaults: VaultForTracking[]) => void;
  walletAddress: string;
}

export default function VaultTracker({
  compassApiSDK,
  vaults,
  setVaults,
  walletAddress,
}: VaultTrackerProps) {
  const [trackVaultAddress, setTrackVaultAddress] = useState('');

  return (
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
              return;
            }
            console.log('trackVaultAddress', trackVaultAddress);
            await addVaultForTracking(
              compassApiSDK,
              setVaults,
              vaults,
              trackVaultAddress,
              walletAddress
            );
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
          disabled={!trackVaultAddress}
        >
          Track Vault
        </button>
      </div>
      
    </div>
  );
}