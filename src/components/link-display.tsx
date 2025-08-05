'use client';

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
  type = 'tag',
  theme = 'dark'
}: Readonly<{
  links: Record<string, string>;
  className?: string;
  type?:'tag'|'list';
  theme?:'dark'|'light';
}>) => {
  if (!links || Object.keys(links).length === 0) {
    return null;
  }

  // 主题样式配置
  const themeStyles = {
    dark: {
      tag: "text-gray-400 border-gray-400 hover:text-white hover:border-white",
      list: "text-gray-300 hover:text-white hover:bg-gray-800"
    },
    light: {
      tag: "text-gray-600 border-gray-400 hover:text-gray-800 hover:border-gray-500",
      list: "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
    }
  };

  const currentTheme = themeStyles[theme];

  // Tag 类型渲染
  if (type === 'tag') {
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
              className={`flex items-center gap-2 px-2 py-0.5 text-sm rounded-full border-1 transition-colors ${currentTheme.tag}`}
            >
              <i className={`text-lg ${iconClass}`}></i>
              <small className="text-xs capitalize">{key}</small>
              <i className="ri-external-link-line"></i>
            </a>
          );
        })}
      </div>
    );
  }

  // List 类型渲染
  if (type === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Object.entries(links).map(([key, url]) => {
          const linkType = getLinkType(key, url);
          const iconClass = LINK_ICONS[linkType] || LINK_ICONS.default;

          return (
            <div key={key} className="flex items-center gap-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full ${currentTheme.list}`}
              >
                <i className={`text-xl ${iconClass} flex-shrink-0`}></i>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium capitalize">{key}</div>
                  <div className="text-xs truncate opacity-70">{url}</div>
                </div>
                <i className="flex-shrink-0 ri-external-link-line"></i>
              </a>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}; 