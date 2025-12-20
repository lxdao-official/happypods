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
import { useMobile } from '~/hooks/useMobile';

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
    const isMobile = useMobile();
    const handleNavClick = () => {
        onClose();
    };

    return (
        <div className="relative md:hidden">
            {/* 汉堡菜单按钮 */}
            <Button
                isIconOnly
                variant="faded"
                onPress={onOpen}
                className="text-black"
                aria-label="Toggle menu"
                size={isMobile ? "sm" : "md"}
            >
                <i className="text-base ri-menu-line"></i>
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
                        title: "text-black data-[hover=true]:text-primary data-[selected=true]:text-primary"
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