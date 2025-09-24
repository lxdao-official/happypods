"use client";
import "~/styles/globals.scss";
import "remixicon/fonts/remixicon.css";

import { Geist } from "next/font/google";
import { HeroUIProvider } from "@heroui/react";

import { TRPCReactProvider } from "~/trpc/react";
import { RainbowKitProviderWrapper } from "~/components/providers/rainbowkit-provider";
import { ConfirmProvider } from "~/components/providers/confirm-provider";
import { AuthProvider } from "~/components/providers/auth-provider";
import { AppLayout } from "~/components/layout/app-layout";
import { GridBackground } from "~/components/layout/grid-background";
import { Toaster } from "sonner";
import { SafeTransactionModal } from "~/components/safe-transaction-steps/safe-transaction-modal";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} light`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: dark)"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="HandheldFriendly" content="true" />
        
        {/* Default SEO Meta Tags */}
        {/* <title>HappyPods - Web3 Grant Management Platform</title> */}
        <meta name="description" content="HappyPods is a Web3 grant management platform that connects Grant Pools with project teams (Pods), providing milestone-based smart funding workflows for transparent and efficient project financing." />
        <meta name="keywords" content="Web3, Grant Management, DAO, Decentralized, Blockchain, Ethereum, Project Funding, Smart Contracts, DeFi, Milestone-based Funding" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="HappyPods - Web3 Grant Management Platform" />
        <meta property="og:description" content="HappyPods is a Web3 grant management platform that connects Grant Pools with project teams (Pods), providing milestone-based smart funding workflows for transparent and efficient project financing." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="HappyPods" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HappyPods - Web3 Grant Management Platform" />
        <meta name="twitter:description" content="HappyPods is a Web3 grant management platform that connects Grant Pools with project teams (Pods), providing milestone-based smart funding workflows for transparent and efficient project financing." />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            input, textarea, select {
              font-size: max(16px, 1rem) !important;
              transform-origin: left top;
              transform: scale(1) !important;
            }
            
            * {
              touch-action: manipulation;
              -webkit-touch-callout: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            html, body {
              // overflow-x: hidden;
              position: relative;
              -webkit-overflow-scrolling: touch;
            }
          `,
          }}
        />
      </head>
      <body>
        <GridBackground />
        <HeroUIProvider locale="en-US">
          <RainbowKitProviderWrapper>
            <TRPCReactProvider>
              <ConfirmProvider>
                <AppLayout>
                  <AuthProvider>{children}</AuthProvider>
                </AppLayout>
                <Toaster position="top-center" richColors theme="light" />
                <SafeTransactionModal />
              </ConfirmProvider>
            </TRPCReactProvider>
          </RainbowKitProviderWrapper>
        </HeroUIProvider>
      </body>
    </html>
  );
}
