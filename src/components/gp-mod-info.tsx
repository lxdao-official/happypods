"use client";

import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Tooltip,
} from "@heroui/react";
import type { GrantsPool } from "@prisma/client";

type Mod = {
  email: string;
  name: string;
  telegram: string;
};

interface GpModInfoProps {
  mod: GrantsPool["modInfo"];
  className?: string;
}

export const GpModInfo = ({ mod, className = "" }: GpModInfoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // 检查mod信息是否存在
  if (!mod) {
    return null;
  }

  const { email, name, telegram } = mod as Mod;

  // 联系方式配置
  const contactMethods = [
    {
      key: "name",
      icon: "ri-user-fill",
      description: `Mod Name: ${name}`,
      action: () => {
        setIsOpen(false);
      },
    },
    {
      key: "email",
      icon: "ri-mail-fill",
      description: `Email: ${email}`,
      action: () => {
        window.open(`mailto:${email}`, "_blank");
        setIsOpen(false);
      },
    },
    {
      key: "telegram",
      icon: "ri-telegram-fill",
      description: `Telegram: @${telegram}`,
      action: () => {
        window.open(`https://t.me/${telegram}`, "_blank");
        setIsOpen(false);
      },
    },
  ];

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <DropdownTrigger>
        <div>
          {/* <Tooltip content={`GP Mod`}> */}
            <i className="text-xl font-bold cursor-pointer ri-user-voice-line hover:scale-105"></i>
          {/* </Tooltip> */}
        </div>
      </DropdownTrigger>
      <DropdownMenu>
        {contactMethods.map((method) => (
          <DropdownItem key={method.key} onClick={method.action}>
            <div className={`flex items-center gap-1 `}>
              <i className={`mr-1 text-xl ${method.icon}`}></i>
              <span>{method.description}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
