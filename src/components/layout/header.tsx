'use client';

import { LoginModal } from '~/components/login-modal';
import NextLink from 'next/link';
import { useState } from 'react';

export function Header() {

  return (
    <header className="p-4 border-b border-border bg-background">
      <div className="flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center basis-1/5">
          <NextLink href="/" className="flex items-center">
            <img src="/logo.svg" alt="HappyPods" className="h-8" />
          </NextLink>
        </div>

        {/* 桌面端导航 */}
        <nav className="flex items-center justify-center flex-1 gap-10 ">
          <NextLink href="/pods" className='hover:text-primary'> Pods</NextLink>
          <NextLink href="/grants-pool" className='hover:text-primary'>Grants Pool</NextLink>
          <NextLink href="/grants-pool" className='hover:text-primary'>How It Works</NextLink>
        </nav>

        {/* 登录按钮 */}
        <div className="flex items-center justify-end basis-1/5">
          <LoginModal />
        </div>
      </div>
    </header>
  );
} 