'use client';

import { LoginModal } from '~/components/login-modal';
import { NotificationDrawer } from '~/components/layout/notification';
import { MobileMenu } from '~/components/layout/mobile-menu';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import useStore from '~/store';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMobile } from '~/hooks/useMobile';

export function Header() {
  const pathname = usePathname();
  const { userInfo } = useStore();
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useMobile();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 防抖函数
  const debounceScroll = useCallback((callback: () => void, delay: number = 16) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(callback, delay);
  }, []);

  const navs = [
    { href: '/', label: 'Home' },
    { href: '/pods', label: 'Pods' },
    { href: '/grants-pool', label: 'Grants Pool' },
    { href: '/how-it-works', label: 'FAQs' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 当滚动回到顶部时，总是显示导航栏
      if (currentScrollY <= 60) {
        setIsHidden(false);
        setLastScrollY(currentScrollY);
        return;
      }

      // 只在PC端（屏幕宽度大于768px）应用滚动隐藏效果
      if (!isMobile) {
        if (currentScrollY > lastScrollY && currentScrollY > 60) {
          // 向下滚动且滚动距离超过100px，隐藏导航栏
          setIsHidden(true);
        } else if (currentScrollY < lastScrollY) {
          // 向上滚动，显示导航栏
          setIsHidden(false);
        }
      } else {
        // 移动端始终显示
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, isMobile]);

  return (
    <header
      className={`sticky top-0 z-30 p-4 border-b backdrop-blur transition-transform duration-1000 ease-in-out ${
        isHidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center w-[150px] md:basis-1/5">
          <NextLink href="/" className="flex items-center transition-all duration-100 hover:scale-105">
            <img src="/logo.svg" alt="HappyPods" className="h-6 md:h-8" />
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
        <div className="flex items-center justify-end gap-2 md:gap-4 md:basis-1/5">
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