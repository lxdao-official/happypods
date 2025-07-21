import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { env } from '~/env';

export const config = getDefaultConfig({
  appName: 'Happy Pods',
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia],
  ssr: true,
}); 