import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletConnectProvider } from "@/contexts/WalletConnectContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compass Labs - WalletConnect Aave Looping",
  description: "A Next.js application demonstrating WalletConnect integration with Compass Labs API for Aave leverage looping",
  keywords: ["Compass Labs", "WalletConnect", "Aave", "Leverage Looping", "DeFi", "Next.js", "TypeScript"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 transition-colors duration-200`}
      >
        <WalletConnectProvider>
          {children}
        </WalletConnectProvider>
      </body>
    </html>
  );
}
