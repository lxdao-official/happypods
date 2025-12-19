'use client';

import { useEffect, useState } from 'react';
import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Config } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { createWagmiConfig } from '~/lib/wagmi';

const queryClient = new QueryClient();

export function RainbowKitProviderWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    // Only create the Wagmi config on the client to avoid SSR WalletConnect storage access (indexedDB).
    setConfig(createWagmiConfig());
  }, []);

  if (!config) return null;

  const theme = lightTheme();
  theme.colors.accentColor = 'var(--color-green2)';
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient} >
        <RainbowKitProvider theme={theme} locale='en-US'>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 
