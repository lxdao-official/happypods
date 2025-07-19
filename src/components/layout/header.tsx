'use client';

import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuToggle, NavbarMenuItem } from '@heroui/react';
import { LoginModal } from '~/app/_components/login-modal';
import NextLink from 'next/link';

export function Header() {
  return (
    <Navbar className="border-b border-border bg-background">
      <NavbarContent>
        <NavbarMenuToggle className="sm:hidden" />
        <NavbarBrand>
          <NextLink href="/">
            <h3 className="text-primary cursor-pointer transition-colors hover:text-primary-foreground">
              Happy Pods
            </h3>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <NextLink href="/pods">
            <Button variant="light" className="text-muted-foreground hover:text-foreground">
              Pods
            </Button>
          </NextLink>
        </NavbarItem>
        <NavbarItem>
          <NextLink href="/grants-pool">
            <Button variant="light" className="text-muted-foreground hover:text-foreground">
              Grants Pool
            </Button>
          </NextLink>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <LoginModal />
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        <NavbarMenuItem>
          <NextLink href="/pods" className="w-full">
            <Button variant="light" className="w-full justify-start">
              Pods
            </Button>
          </NextLink>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <NextLink href="/grants-pool" className="w-full">
            <Button variant="light" className="w-full justify-start">
              Grants Pool
            </Button>
          </NextLink>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
} 