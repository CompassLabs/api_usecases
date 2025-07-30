import { arbitrum } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
 
export const config = createConfig({
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http()
  }
});