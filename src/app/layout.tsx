"use client";
import "~/styles/globals.css";

import { Geist } from "next/font/google";
import { HeroUIProvider } from "@heroui/react";

import { TRPCReactProvider } from "~/trpc/react";
import { RainbowKitProviderWrapper } from "~/components/providers/rainbowkit-provider";
import { AppLayout } from "~/components/layout/app-layout";
import { GridBackground } from "~/components/layout/grid-background";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <head>
        <title>HappyPods</title>
        <meta name="description" content="A Web3 application built with T3 Stack" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <GridBackground />
        <HeroUIProvider>
          <RainbowKitProviderWrapper>
            <TRPCReactProvider>
              <AppLayout>{children}</AppLayout>
            </TRPCReactProvider>
          </RainbowKitProviderWrapper>
        </HeroUIProvider>
      </body>
    </html>
  );
}
