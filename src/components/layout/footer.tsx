'use client';

import { Container, Group, Text, Anchor, Stack, Title, Box } from '@mantine/core';

export function Footer() {
  return (
    <Box component="footer" bg="dark.8" py="xl" style={{ borderTop: '1px solid var(--mantine-color-dark-4)' }}>
      <Container size="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={4} c="white">
              Happy <span style={{ color: '#a855f7' }}>Pods</span>
            </Title>
            <Text size="sm" c="gray.5">
              A Web3 application built with T3 Stack and RainbowKit
            </Text>
          </Stack>
          
          <Group gap="xl">
            <Stack gap="xs">
              <Text size="sm" fw={500} c="white">Links</Text>
              <Anchor href="/" size="sm" c="gray.5">Home</Anchor>
              <Anchor href="/about" size="sm" c="gray.5">About</Anchor>
              <Anchor href="/docs" size="sm" c="gray.5">Documentation</Anchor>
            </Stack>
            
            <Stack gap="xs">
              <Text size="sm" fw={500} c="white">Resources</Text>
              <Anchor href="https://create.t3.gg" target="_blank" size="sm" c="gray.5">T3 Stack</Anchor>
              <Anchor href="https://mantine.dev" target="_blank" size="sm" c="gray.5">Mantine</Anchor>
              <Anchor href="https://rainbowkit.com" target="_blank" size="sm" c="gray.5">RainbowKit</Anchor>
            </Stack>
          </Group>
        </Group>
        
        <Text size="xs" c="gray.6" ta="center" mt="xl">
          © 2024 Happy Pods. Built with ❤️ using modern web technologies.
        </Text>
      </Container>
    </Box>
  );
} 