"use client";

import { useUserInfo } from "~/hooks/useUserInfo";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";

interface RequireLoginProps {
  children: React.ReactNode;
  disabled?: boolean;
  showPlaceholder?: boolean; // 是否显示占位界面
}

const RequireLogin = ({ 
  children, 
  disabled = false, 
  showPlaceholder = false
}: RequireLoginProps) => {
  const { userInfo } = useUserInfo();
  const { openConnectModal } = useConnectModal();

  // 如果用户已登录或者组件被禁用，直接返回子组件
  if (userInfo || disabled) {
    return <>{children}</>;
  }

  // 如果需要显示占位界面（适用于包裹整个页面的场景）
  if (showPlaceholder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              You need to connect your wallet to continue using this feature
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to continue using this feature
            </p>
          </div>
          
          <div className="flex justify-center">
            <ConnectButton showBalance={false} chainStatus="none" />
          </div>
        </div>
      </div>
    );
  }

  // 处理点击事件，拦截并触发连接弹窗（适用于包裹操作按钮的场景）
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (openConnectModal) {
      openConnectModal();
    }
  };

  // 如果子组件是单个有效的 React 元素，克隆并添加点击处理
  if (isValidElement(children)) {
    const element = children as ReactElement<any>;
    return cloneElement(element, {
      ...element.props,
      onClick: handleClick,
      style: {
        cursor: 'pointer',
        ...(element.props?.style || {})
      }
    });
  }

  // 如果是多个子组件或文本，包裹在一个 div 中
  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
};

export default RequireLogin;