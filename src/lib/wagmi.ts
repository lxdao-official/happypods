import { coinbaseWallet, metaMaskWallet, rainbowWallet, safeWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { optimism } from 'wagmi/chains';
import { env } from '~/env';

const baseWallets = [safeWallet, rainbowWallet, coinbaseWallet, metaMaskWallet];

export const createWagmiConfig = () =>
  getDefaultConfig({
    appName: 'Happy Pods',
    projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
    chains: [optimism],
    ssr: true,
    wallets: [
      {
        groupName: 'Popular',
        // WalletConnect relies on indexedDB; only add it in the browser to avoid SSR crashes.
        wallets: typeof window === 'undefined' ? baseWallets : [...baseWallets, walletConnectWallet],
      },
    ],
  });
