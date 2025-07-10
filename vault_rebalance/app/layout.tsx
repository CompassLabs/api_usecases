import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Vault Rebalance',
    description: 'Make use of Compass Bundle to rebalance your vaults',
    icons: {
        icon: '/images/logo.svg',
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" data-oid="_051rw4">
            <body className="" data-oid="pgocda6">
                {children}
            </body>
        </html>
    );
}
