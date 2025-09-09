'use client';

import { Link } from '@heroui/react';

export function Footer() {
  return (
    <footer className="py-8 border-t text-foreground">
      <div className="container px-4 mx-auto">
        <div className="items-start justify-between gap-8 md:flex">
          <div className="space-y-4">
            <img src="/logo.svg" alt="logo" className="h-[40px]" />
            <p className="text-sm text-muted-foreground">
              Quickly obtain funding to launch your project
            </p>
          </div>
          
          <div className="flex gap-16 mt-4 md:mt-0">
            
            <div className="space-y-2">
              <p className="text-xl font-medium text-foreground">Links</p>
              <Link href="https://github.com/lxdao-official/happypods" target='_blank' className="block text-sm text-muted-foreground hover:underline">Github</Link>
              <Link href="https://fairsharing.xyz" target='_blank' className="block text-sm text-muted-foreground hover:underline">Fairsharing</Link>
            </div>

            <div className="space-y-2">
              <p className="text-xl font-medium text-foreground">Support</p>
              <Link href="https://lxdao.io/" target='_blank' className="block text-sm text-muted-foreground hover:underline">LXDAO</Link>
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