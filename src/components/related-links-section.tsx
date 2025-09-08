'use client';
import { useState } from "react";
import { Input, Button } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";

const PRESET_LINKS = [
  { key: "twitter", label: "Twitter", icon: <i className="ri-twitter-line" />, placeholder: "https://twitter.com/..." },
  { key: "telegram", label: "Telegram", icon: <i className="ri-telegram-line" />, placeholder: "https://t.me/..." },
  { key: "website", label: "Website", icon: <i className="ri-global-line" />, placeholder: "https://..." },
  { key: "github", label: "GitHub", icon: <i className="ri-github-line" />, placeholder: "https://github.com/..." },
  { key: "discord", label: "Discord", icon: <i className="ri-discord-line" />, placeholder: "https://discord.gg/..." },
];

interface LinkItem {
  key: string;
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
  // 初始化链接项
  const [items, setItems] = useState<LinkItem[]>(() => {
    const presetItems = PRESET_LINKS
      .filter(preset => links[preset.key])
      .map(preset => ({ ...preset, url: links[preset.key] ?? "" }));
    
    const customItems = Object.entries(links)
      .filter(([key]) => key.startsWith('other_'))
      .map(([key, url]) => ({ 
        key, 
        label: "Other", 
        url: url || "", 
        isCustom: true,
        placeholder: "https://..."
      }));

    const allItems = [...presetItems, ...customItems];
    return allItems.length > 0 ? allItems : [];
  });


  // 计算可用选项
  const usedPresetKeys = items.filter(item => !item.isCustom).map(item => item.key);
  const availablePresets = PRESET_LINKS.filter(preset => !usedPresetKeys.includes(preset.key));
  const canAddMore = items.length < 8;

  // 添加链接
  const addLink = (tab: typeof availablePresets[number] | { key: "other"; label: string; icon: React.ReactNode }) => {
    if (tab.key === "other") {
      const customKey = `other_${Date.now()}`;
      const newItem = { key: customKey, label: "Other", url: "", isCustom: true };
      setItems([...items, newItem]);
      onLinksChange({ ...links, [customKey]: "" });
      return;
    }
    
    const newItem = { ...tab, url: "" };
    setItems([...items, newItem]);
    onLinksChange({ ...links, [tab.key]: "" });
  };

  // 更新链接
  const updateLink = (key: string, value: string) => {
    setItems(items.map(item => item.key === key ? { ...item, url: value } : item));
    onLinksChange({ ...links, [key]: value });
  };

  // 删除链接
  const removeLink = (key: string) => {
    setItems(items.filter(item => item.key !== key));
    const newLinks = { ...links };
    delete newLinks[key];
    onLinksChange(newLinks);
  };

  // 渲染链接项
  const renderLinkItem = (item: LinkItem) => (
    <div key={item.key} className="flex items-center gap-2">
      <span className="flex items-center w-24 gap-1 font-medium0">
        {item.icon || <i className="ri-link" />} {item.label}
      </span>
      <Input
        variant="faded"
        type="url"
        value={item.url}
        onChange={e => updateLink(item.key, e.target.value)}
        placeholder={item.placeholder || "https://..."}
        className="flex-1"
      />
      <Button
        isIconOnly
        color="default"
        variant="light"
        size="sm"
        onPress={() => removeLink(item.key)}
      >
        <i className="ri-subtract-line" />
      </Button>
    </div>
  );

  // 渲染添加按钮
  const renderAddButtons = () => {
    if (!canAddMore) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {availablePresets.map(preset => (
          <Button
            key={preset.key}
            type="button"
            onPress={() => addLink(preset)}
          >
            {preset.icon} {preset.label}
          </Button>
        ))}
        <Button 
          type="button" 
          onPress={() => addLink({ key: "other", label: "Others", icon: <i className="ri-add-line" /> })}
        >
          <i className="ri-add-line" /> Others
        </Button>
      </div>
    );
  };

  return (
    <CornerFrame backgroundColor="var(--color-background)" color="gray">
      <h2 className="mb-6 text-xl">Links</h2>
      {renderAddButtons()}
      <div className="flex flex-col gap-3">
        {items.map(renderLinkItem)}
      </div>
    </CornerFrame>
  );
};

export default RelatedLinksSection; 