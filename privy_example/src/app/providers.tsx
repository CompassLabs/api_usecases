'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { mainnet } from 'viem/chains';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        embeddedWallets: {
            showWalletUIs: false,
            createOnLogin: 'users-without-wallets'
        },
        defaultChain: mainnet,
        supportedChains: [mainnet],
        }
      }
    >
      {children}
    </PrivyProvider>
  );
}
