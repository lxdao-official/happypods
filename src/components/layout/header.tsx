'use client';

import { Group, Title, Button, Container, Burger, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LoginModal } from '~/app/_components/login-modal';
import NextLink from 'next/link';

export function Header() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Box component="header" h={60} className="border-b border-gray-200 bg-white">
      <Container size="lg" h="100%">
        <Group justify="space-between" h="100%">
          
          <NextLink href="/">
            <Title order={3} className="text-violet-600 hover:text-violet-700 transition-colors cursor-pointer">
              Happy Pods
            </Title>
          </NextLink>

          
          <Group gap="md" visibleFrom="sm">
            <NextLink href="/pods">
              <Button variant="subtle" color="gray">
                Pods
              </Button>
            </NextLink>
            <NextLink href="/grants-pool">
              <Button variant="subtle" color="gray">
                Grants Pool
              </Button>
            </NextLink>
            <LoginModal />
          </Group>

          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        </Group>
      </Container>
    </Box>
  );
} 