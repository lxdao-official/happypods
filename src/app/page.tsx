import Link from "next/link";
import { Container, Title, Text, Button, Group, Paper, Stack, Space } from '@mantine/core';
import { LatestPost } from "~/app/_components/post";
import { WalletInfo } from "~/components/wallet-info";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white flex items-center justify-center">
        <Container size="md" py="xl">
          <Paper shadow="md" radius="lg" p="xl" withBorder bg="dark.8">
            <Stack align="center">
              <Title order={1} ta="center" c="white">
                Welcome to <Text span c="violet.4">Happy Pods</Text>
              </Title>
              <Text size="lg" ta="center" c="gray.2">
                A Web3 application built with T3 Stack, RainbowKit and Mantine
              </Text>
              <WalletInfo />
              <Group mt="md" justify="center">
                <Button
                  component="a"
                  href="https://create.t3.gg/en/usage/first-steps"
                  target="_blank"
                  variant="light"
                  color="violet"
                >
                  First Steps →
                </Button>
                <Button
                  component="a"
                  href="https://create.t3.gg/en/introduction"
                  target="_blank"
                  variant="light"
                  color="violet"
                >
                  Documentation →
                </Button>
              </Group>
              <Text size="xl" mt="md" c="white">
                {hello ? hello.greeting : "Loading tRPC query..."}
              </Text>
              <LatestPost />
            </Stack>
          </Paper>
        </Container>
      </div>
    </HydrateClient>
  );
}
