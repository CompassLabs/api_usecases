import { base } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
// import { config as dotenvConfig } from 'dotenv';
// dotenvConfig();

// const RPC_URL = process.env.REACT_APP_RPC_URL;

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http()
  }
});