'use client';

import { LoginModal } from '~/components/login-modal';
import { NotificationDrawer } from '~/components/layout/notification';
import { MobileMenu } from '~/components/layout/mobile-menu';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import useStore from '~/store';
import Test from '~/components/Test';

export function Header() {
  const pathname = usePathname();
  const { userInfo } = useStore();

  const navs = [
    { href: '/', label: 'Home' },
    { href: '/pods', label: 'Pods' },
    { href: '/grants-pool', label: 'Grants Pool' },
    { href: '/how-it-works', label: 'FAQs' },
  ];

  return (
    <header className="sticky top-0 z-30 p-4 border-b border-border backdrop-blur bg-[#212121d1]">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center w-[150px] md:basis-1/5">
          <NextLink href="/" className="flex items-center transition-all duration-100 hover:scale-105">
            <img src="/logo.svg" alt="HappyPods" className="h-8" />
          </NextLink>
        </div>

        {/* 桌面端导航 */}
        <nav className="items-center justify-center flex-1 hidden gap-10 md:flex">
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

        {/* <ConnectButton/> */}

        {/* 登录按钮和移动端菜单 */}
        <div className="flex items-center justify-end gap-4 basis-1/5">
          {
            userInfo?.id && 
            <NotificationDrawer />
          }

          <LoginModal />

          {/* 移动端菜单 */}
          <MobileMenu navs={navs} />
        </div>
      </div>
    </header>
  );
} 