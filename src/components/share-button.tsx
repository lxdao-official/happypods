'use client';

import { useState } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { toast } from 'sonner';

interface ShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'default';
  className?: string;
}

export const ShareButton = ({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = '分享这个内容',
  className
}: Readonly<ShareButtonProps>) => {
  const [isOpen, setIsOpen] = useState(false);

  // 复制链接到剪贴板
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('复制成功');
      // 关闭下拉菜单
      setIsOpen(false);
    } catch (err) {
      toast.error('复制失败');
    }
  };

  // 分享到推特
  const shareToTwitter = () => {
    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  // 分享到 Telegram
  const shareToTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(telegramUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <DropdownTrigger>
         <i className={`text-2xl cursor-pointer ri-share-line ${className}`}></i>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="分享选项"
      >
        <DropdownItem
          key="twitter"
          startContent={<i className="text-xl text-gray-50 ri-twitter-fill"></i>}
          onClick={shareToTwitter}
        >
          分享到推特
        </DropdownItem>
        <DropdownItem
          key="copy"
          startContent={<i className="text-xl text-gray-50 ri-link"></i>}
          onClick={copyLink}
        >
          复制链接
        </DropdownItem>
        <DropdownItem
          key="telegram"
          startContent={<i className="text-xl text-gray-50 ri-telegram-fill"></i>}
          onClick={shareToTelegram}
        >
          分享到 Telegram
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
