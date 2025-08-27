import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MetaMaskProvider } from "@/contexts/MetaMaskContext";

export const metadata: Metadata = {
  title: "Compass Labs - MetaMask Vault Dashboard",
  description: "A Next.js application demonstrating MetaMask integration with Compass Labs API for vault management",
  keywords: ["Compass Labs", "MetaMask", "Vault", "DeFi", "Morpho", "Next.js", "TypeScript"],
  authors: [{ name: "Compass Labs" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-white dark:bg-gray-900 transition-colors duration-200`}
      >
        <MetaMaskProvider>
          {children}
        </MetaMaskProvider>
      </body>
    </html>
  );
}
