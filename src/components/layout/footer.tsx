'use client';

import { Link } from '@heroui/react';

export function Footer() {
  return (
    <footer className="py-8 bg-background border-t border-border text-foreground">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-start gap-8">
          <div className="space-y-2">
            <h4 className="text-foreground">
              Happy <span className="text-primary">Pods</span>
            </h4>
            <p className="text-sm text-muted-foreground">
              A Web3 application built with T3 Stack and RainbowKit
            </p>
          </div>
          
          <div className="flex gap-8">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Links</p>
              <Link href="/" className="text-sm text-muted-foreground block">Home</Link>
              <Link href="/about" className="text-sm text-muted-foreground block">About</Link>
              <Link href="/docs" className="text-sm text-muted-foreground block">Documentation</Link>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Resources</p>
              <Link href="https://create.t3.gg" target="_blank" className="text-sm text-muted-foreground block">T3 Stack</Link>
              <Link href="https://heroui.com" target="_blank" className="text-sm text-muted-foreground block">HeroUI</Link>
              <Link href="https://rainbowkit.com" target="_blank" className="text-sm text-muted-foreground block">RainbowKit</Link>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-center mt-8 text-muted-foreground">
          © 2024 Happy Pods. Built with ❤️ using modern web technologies.
        </p>
      </div>
    </footer>
  );
} 