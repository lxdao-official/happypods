"use client";
import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

import { TRPCReactProvider } from "~/trpc/react";
import { RainbowKitProviderWrapper } from "~/components/providers/rainbowkit-provider";
import { AppLayout } from "~/components/layout/app-layout";



const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <title>Happy Pods</title>
        <meta name="description" content="A Web3 application built with T3 Stack" />
        <link rel="icon" href="/favicon.ico" />
      </head>
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
