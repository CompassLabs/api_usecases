export interface WalletState {
    isConnected: boolean;
    address: string | null;
    isConnecting: boolean;
    error: string | null;
  }
  
  export interface MetaMaskError {
    code: number;
    message: string;
  }
  
  type Eip1193Provider = {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (data: any) => void) => void;
    removeListener: (event: string, handler: (data: any) => void) => void;
    // Optional fields used by some environments
    providers?: Eip1193Provider[];
    isConnected?: () => boolean;
    _metamask?: { isUnlocked?: () => Promise<boolean> };
  };
  
  declare global {
    interface Window {
      ethereum?: Eip1193Provider;
    }
  }