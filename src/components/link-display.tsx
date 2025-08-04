'use client';

import { Chip } from "@heroui/react";

interface LinkDisplayProps {
  links: Record<string, string>;
  className?: string;
}

// 链接类型到图标的映射
const LINK_ICONS: Record<string, string> = {
  website: 'ri-global-line',
  github: 'ri-github-fill',
  twitter: 'ri-twitter-fill',
  x: 'ri-twitter-x-line',
  telegram: 'ri-telegram-fill',
  discord: 'ri-discord-fill',
  linkedin: 'ri-linkedin-fill',
  youtube: 'ri-youtube-fill',
  medium: 'ri-medium-fill',
  blog: 'ri-article-line',
  docs: 'ri-file-text-line',
  whitepaper: 'ri-file-paper-line',
  demo: 'ri-play-circle-line',
  app: 'ri-app-store-line',
  android: 'ri-google-play-line',
  ios: 'ri-apple-line',
  email: 'ri-mail-line',
  phone: 'ri-phone-line',
  address: 'ri-map-pin-line',
  default: 'ri-link',
};

// 获取链接类型（从URL或键名推断）
const getLinkType = (key: string, url: string): string => {
  const lowerKey = key.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  // 从键名推断
  if (LINK_ICONS[lowerKey]) {
    return lowerKey;
  }
  
  // 从URL推断
  if (lowerUrl.includes('github.com')) return 'github';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram.me')) return 'telegram';
  if (lowerUrl.includes('discord.gg') || lowerUrl.includes('discord.com')) return 'discord';
  if (lowerUrl.includes('linkedin.com')) return 'linkedin';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('medium.com')) return 'medium';
  if (lowerUrl.includes('mailto:')) return 'email';
  if (lowerUrl.includes('tel:')) return 'phone';
  
  // 默认类型
  return 'default';
};

export const LinkDisplay = ({
  links,
  className = '',
}: Readonly<LinkDisplayProps>) => {
  if (!links || Object.keys(links).length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      {Object.entries(links).map(([key, url]) => {
        const linkType = getLinkType(key, url);
        const iconClass = LINK_ICONS[linkType] || LINK_ICONS.default;

        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1 text-sm text-gray-400 border-gray-400 rounded-full hover:text-white border-1 hover:border-white"
          >
            <i className={`text-lg ${iconClass}`}></i>
            <small className="text-xs capitalize">{key}</small>
          </a>
        );
      })}
    </div>
  );
}; 