'use client';

import { Tooltip } from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';
import { truncateString } from '../lib/utils';
import CopyIcon from './copy-icon';

interface QRCodeTooltipProps {
  content: string; // 要生成二维码的内容
  icon?: React.ReactNode; // 自定义图标，默认为 ri-qr-code-line
  size?: number; // 二维码尺寸
  className?: string; // 容器样式
}

export const QRCodeTooltip = ({
  content,
  icon,
  size = 150,
  className = ""
}: Readonly<QRCodeTooltipProps>) => {
  // 默认图标
  const defaultIcon = <i className="text-xl ri-qr-code-line"></i>;

  return (
    <Tooltip 
      content={
        <div className="flex flex-col items-center justify-center">
          <QRCodeSVG 
            value={content}
            size={size}
            level="M"
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#000000"
          />
          <div className='flex items-center gap-2 mb-4'>
            <div>{truncateString(content, 6, 6)}</div>
            <CopyIcon text={content} />
          </div>
        </div>
      }
      placement="top"
      showArrow
      className={className}
    >
      <div className="transition-opacity cursor-pointer hover:opacity-80">
        {icon || defaultIcon}
      </div>
    </Tooltip>
  );
}; 