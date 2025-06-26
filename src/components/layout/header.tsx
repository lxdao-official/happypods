'use client';

import { Group, Title, Button, Container, Burger, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ConnectWallet } from '~/components/connect-wallet';

export function Header() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Box component="header" h={60} bg="dark.8" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}>
      <Container size="lg" h="100%">
        <Group justify="space-between" h="100%">
          <Title order={3} c="white">
            Happy <span style={{ color: '#a855f7' }}>Pods</span>
          </Title>
          
          <Group gap="md" visibleFrom="sm">
            <Button variant="subtle" color="gray.2" component="a" href="/">
              Home
            </Button>
            <Button variant="subtle" color="gray.2" component="a" href="/about">
              About
            </Button>
            <Button variant="subtle" color="gray.2" component="a" href="/docs">
              Docs
            </Button>
            <ConnectWallet />
          </Group>

          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
        </Group>
      </Container>
    </Box>
  );
} 