import { useState } from "react";
import { Input, Button } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";

const PRESET_LINKS = [
  { key: "twitter", label: "Twitter", icon: <i className="ri-twitter-line" /> , placeholder: "https://twitter.com/..." },
  { key: "telegram", label: "Telegram", icon: <i className="ri-telegram-line" />, placeholder: "https://t.me/..." },
  { key: "website", label: "Website", icon: <i className="ri-global-line" />, placeholder: "https://..." },
  { key: "github", label: "GitHub", icon: <i className="ri-github-line" />, placeholder: "https://github.com/..." },
  { key: "discord", label: "Discord", icon: <i className="ri-discord-line" />, placeholder: "https://discord.gg/..." },
];

interface LinkItem {
  key: string; // 唯一key
  label: string;
  icon?: React.ReactNode;
  url: string;
  isCustom?: boolean;
  placeholder?: string;
}

interface RelatedLinksSectionProps {
  links: Record<string, string>;
  onLinksChange: (links: Record<string, string>) => void;
}

const RelatedLinksSection = ({ links, onLinksChange }: RelatedLinksSectionProps) => {
  // 当前已添加的类型
  const [items, setItems] = useState<LinkItem[]>(() => {
    // 初始化：已存在的links优先，否则默认前三个
    const preset = PRESET_LINKS.filter(l => links[l.key]).map(l => ({ ...l, url: links[l.key] ?? "" }));
    if (preset.length > 0) return preset;
    return PRESET_LINKS.slice(0, 3).map(l => ({ ...l, url: "" }));
  });

  // tab可选项（最多8个链接）
  const presetKeys = PRESET_LINKS.map(l => l.key);
  const presetUsed = items.filter(i => presetKeys.includes(i.key)).map(i => i.key);
  const availableTabs = items.length >= 8 ? [] : [
    ...PRESET_LINKS.filter(l => !presetUsed.includes(l.key)),
    { key: "other", label: "Others", icon: <i className="ri-add-line" /> },
  ];

  // 选中tab添加
  const handleTabAdd = (tab: typeof availableTabs[number]) => {
    if (tab.key === "other") {
      // 直接添加一个label为Other的输入框
      const customKey = `other_${Date.now()}`;
      setItems([...items, { key: customKey, label: "Other", url: "", isCustom: true }]);
      onLinksChange({ ...links, [customKey]: "" });
      return;
    }
    setItems([...items, { ...tab, url: "" }]);
    onLinksChange({ ...links, [tab.key]: "" });
  };

  // 删除
  const handleRemove = (key: string) => {
    setItems(items.filter(i => i.key !== key));
    const newLinks = { ...links };
    delete newLinks[key];
    onLinksChange(newLinks);
  };

  // 输入变更
  const handleInput = (key: string, value: string) => {
    setItems(items.map(i => i.key === key ? { ...i, url: value } : i));
    onLinksChange({ ...links, [key]: value });
  };

  return (
    <CornerFrame backgroundColor="var(--color-background)">
      <h2 className="mb-6 text-xl">Related Links</h2>
      {/* tab 区域：只显示未添加的预设类型和Others按钮 */}
      {availableTabs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {availableTabs.map(tab => (
            <Button
              key={tab.key}
              type="button"
              onPress={() => handleTabAdd(tab)}
            >
              {tab.icon || <i className="ri-link" />} {tab.label}
            </Button>
          ))}
        </div>
      )}
      {/* 链接输入区 */}
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span className="flex items-center w-24 gap-1 font-medium text-gray-500">
              {item.icon || <i className="ri-link" />} {item.label}
            </span>
            <Input
              type="url"
              value={item.url}
              onChange={e => handleInput(item.key, e.target.value)}
              placeholder={item.placeholder || "https://..."}
              className="flex-1"
            />
            <Button
              isIconOnly
              color="default"
              variant="light"
              size="sm"
              onPress={() => handleRemove(item.key)}
            >
              <i className="ri-subtract-line" />
            </Button>
          </div>
        ))}
      </div>
    </CornerFrame>
  );
};

export default RelatedLinksSection; 