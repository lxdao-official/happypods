'use client';

import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '~/lib/wagmi';

const queryClient = new QueryClient();

export function RainbowKitProviderWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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