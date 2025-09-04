import { WalletConnect } from "@/components/WalletConnect";
import { WalletInfo } from "@/components/EmbeddedWallet";
import { AaveLooping } from "@/components/AaveLoop";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Compass Labs
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            WalletConnect Integration with Aave Leverage Looping
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto space-y-8">
          {/* Wallet Connection */}
          <WalletConnect />
          
          {/* Wallet Info */}
          <WalletInfo />

          {/* Aave Looping */}
          <AaveLooping />
          
          {/* Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Features
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🔗 WalletConnect Integration
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>• Multi-wallet support</li>
                  <li>• Base network support</li>
                  <li>• EIP-5792 transaction batching</li>
                  <li>• Secure wallet interaction</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ⚡ Transaction Bundling
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>• Batch multiple transactions</li>
                  <li>• Gas optimization</li>
                  <li>• Single approval flow</li>
                  <li>• Reduced transaction costs</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  📈 Aave Looping
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>• Leverage up to 5x</li>
                  <li>• Customizable LTV ratios</li>
                  <li>• Multiple token pairs</li>
                  <li>• Risk validation</li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-600 dark:text-gray-400">
          <p>Built with Next.js, TypeScript, and WalletConnect</p>
          <p className="mt-2">
            <a href="https://docs.reown.com/" className="text-blue-600 dark:text-blue-400 hover:underline">
              WalletConnect Documentation
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
