'use client';

import { Link } from '@heroui/react';

export function Footer() {
  return (
    <footer className="py-8 border-t bg-background border-border text-foreground">
      <div className="container px-4 mx-auto">
        <div className="flex items-start justify-between gap-8">
          <div className="space-y-4">
            <img src="/logo.svg" alt="logo" className="h-[40px]" />
            <p className="text-sm text-muted-foreground">
              Quickly obtain funding to launch your project
            </p>
          </div>
          
          <div className="flex gap-16">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Links</p>
              <Link href="/" className="block text-sm text-muted-foreground">Home</Link>
              <Link href="/about" className="block text-sm text-muted-foreground">About</Link>
              <Link href="/docs" className="block text-sm text-muted-foreground">Documentation</Link>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Resources</p>
              <Link href="https://create.t3.gg" target="_blank" className="block text-sm text-muted-foreground">T3 Stack</Link>
              <Link href="https://heroui.com" target="_blank" className="block text-sm text-muted-foreground">HeroUI</Link>
              <Link href="https://rainbowkit.com" target="_blank" className="block text-sm text-muted-foreground">RainbowKit</Link>
            </div>
            
            <div>
              <img src="/buildin.png" alt="buildin" />
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
} 