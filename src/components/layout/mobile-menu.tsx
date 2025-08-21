'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    useDisclosure,
    Listbox,
    ListboxItem
} from '@heroui/react';

interface NavItem {
    href: string;
    label: string;
}

interface MobileMenuProps {
    navs: NavItem[];
}

export function MobileMenu({ navs }: MobileMenuProps) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const pathname = usePathname();

    const handleNavClick = () => {
        onClose();
    };

    return (
        <div className="relative md:hidden">
            {/* 汉堡菜单按钮 */}
            <Button
                isIconOnly
                variant="light"
                onPress={onOpen}
                className="text-white"
                aria-label="Toggle menu"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </Button>

            {/* HeroUI Drawer */}
            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                placement="bottom"
                isDismissable={true}
            >
                <DrawerContent>
                {(onClose) => (
                    <Listbox
                    aria-label="Navigation"
                    className="p-4"
                    itemClasses={{
                        base: "px-4 py-3 rounded-none data-[hover=true]:bg-primary/10 data-[selected=true]:bg-primary/20",
                        title: "text-white data-[hover=true]:text-primary data-[selected=true]:text-primary"
                    }}
                >
                    
                    {navs.map((nav) => (
                        <ListboxItem
                            key={nav.href}
                            textValue={nav.label}
                            className={
                                pathname === nav.href || (nav.href !== '/' && pathname.startsWith(nav.href))
                                    ? 'bg-primary/20 text-primary'
                                    : ''
                            }
                            onPress={handleNavClick}
                        >
                            <NextLink href={nav.href} className="block w-full text-xl">
                                {nav.label}
                            </NextLink>
                        </ListboxItem>
                    ))}
                </Listbox>
                )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}