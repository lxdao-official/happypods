"use client";
import "~/styles/globals.css";
import 'remixicon/fonts/remixicon.css'

import { Geist } from "next/font/google";
import { HeroUIProvider } from "@heroui/react";

import { TRPCReactProvider } from "~/trpc/react";
import { RainbowKitProviderWrapper } from "~/components/providers/rainbowkit-provider";
import { AppLayout } from "~/components/layout/app-layout";
import { GridBackground } from "~/components/layout/grid-background";
import { Toaster } from "sonner";

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
        <meta name="description" content="HappyPods" />
        <meta name="keywords" content="HappyPods" />
        <link rel="icon" href="/logo_s.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="HandheldFriendly" content="true" />
        <style dangerouslySetInnerHTML={{
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
          `
        }} />
      </head>
      <body>
        <GridBackground />
        <HeroUIProvider locale="en-US">
          <RainbowKitProviderWrapper>
            <TRPCReactProvider>
              <AppLayout>{children}</AppLayout>
              <Toaster position="top-center" richColors theme="dark" />
            </TRPCReactProvider>
          </RainbowKitProviderWrapper>
        </HeroUIProvider>
      </body>
    </html>
  );
}
