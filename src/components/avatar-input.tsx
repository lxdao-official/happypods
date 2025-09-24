'use client';

import { useState } from 'react';
import { Input, Tabs, Tab } from "@heroui/react";
import AvatarUpload from './avatar-upload';

interface AvatarInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  size?: "sm" | "md" | "lg";
  previewSize?: "sm" | "md" | "lg";
  maxFileSize?: number; // 最大文件大小，单位为MB
  acceptedTypes?: string[]; // 接受的文件类型
}

type InputMode = 'url' | 'upload';

export default function AvatarInput({
  value,
  onChange,
  placeholder = "https://example.com/avatar.jpg",
  description,
  isRequired = false,
  size = "md",
  previewSize = "md",
  maxFileSize = 2,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}: AvatarInputProps) {
  const [activeTab, setActiveTab] = useState<InputMode>('url');

  const getPreviewSizeClass = () => {
    switch (previewSize) {
      case "sm":
        return "w-6 h-6";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-8 h-8";
    }
  };

  const handleUpload = (publicUrl: string) => {
    // 当用户上传文件时，将 S3 公开URL 传递给父组件
    onChange(publicUrl);
  };

  return (
    <div className="space-y-4">

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as InputMode)}
        className="w-full"
      >
        <Tab key="url" title="Input URL" />
        <Tab key="upload" title="Upload File" />
      </Tabs>

      <div className="mt-4">
        {activeTab === 'url' && (
          <Input
            variant="faded"
            type="url"
            label="Avatar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            isRequired={isRequired}
            size={size}
            errorMessage={'Please enter a valid avatar URL'}
            endContent={
              value && (
                <img
                  src={value}
                  alt="Avatar Preview"
                  className={`object-contain rounded-full ${getPreviewSizeClass()}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                  }}
                />
              )
            }
          />
        )}

        {activeTab === 'upload' && (
          <AvatarUpload
            onUpload={handleUpload}
            initialUrl={value}
            previewSize={previewSize}
            maxSize={maxFileSize}
            acceptedTypes={acceptedTypes}
          />
        )}
      </div>

      {/* {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )} */}
    </div>
  );
} 