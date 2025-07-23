'use client';

import { LoginModal } from '~/components/login-modal';
import NextLink from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const navs = [
    { href: '/', label: 'Home' },
    { href: '/pods', label: 'Pods' },
    { href: '/grants-pool', label: 'Grants Pool' },
    { href: '/how-it-works', label: 'How It Works' },
  ];

  return (
    <header className="p-4 border-b border-border bg-background">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center basis-1/5">
          <NextLink href="/" className="flex items-center transition-all duration-100 hover:scale-105">
            <img src="/logo.svg" alt="HappyPods" className="h-8" />
          </NextLink>
        </div>

        {/* 桌面端导航 */}
        <nav className="flex items-center justify-center flex-1 gap-10 ">
          {navs.map(nav => (
            <NextLink
              key={nav.href}
              href={nav.href}
              className={
                (pathname === nav.href || (nav.href !== '/' && pathname.startsWith(nav.href)))
                  ? 'text-primary' : 'hover:text-primary'
                  }
                >
              {nav.label}
            </NextLink>
          ))}
        </nav>

        {/* 登录按钮 */}
        <div className="flex items-center justify-end basis-1/5">
          <LoginModal />
        </div>
      </div>
    </header>
  );
} 