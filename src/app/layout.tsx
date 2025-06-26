import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

import { TRPCReactProvider } from "~/trpc/react";
import { RainbowKitProviderWrapper } from "~/components/providers/rainbowkit-provider";
import { AppLayout } from "~/components/layout/app-layout";

export const metadata: Metadata = {
  title: "Happy Pods",
  description: "A Web3 application built with T3 Stack",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <MantineProvider defaultColorScheme="dark">
          <RainbowKitProviderWrapper>
            <TRPCReactProvider>
              <AppLayout>{children}</AppLayout>
            </TRPCReactProvider>
          </RainbowKitProviderWrapper>
        </MantineProvider>
      </body>
    </html>
  );
}
