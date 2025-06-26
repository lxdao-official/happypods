'use client';

import { Box } from '@mantine/core';
import { Header } from './header';
import { Footer } from './footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" style={{ flex: 1 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
} 