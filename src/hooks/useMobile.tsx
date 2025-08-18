import { useState, useEffect, useCallback } from 'react';

/**
 * 自定义Hook用于检测当前设备是否为移动端
 * @returns {boolean} 如果是移动设备返回true，否则返回false
 */
export const useMobile = (): boolean => {
  // 检查是否在浏览器环境中（SSR兼容性）
  const isClient = typeof window !== 'undefined';
  
  // 获取初始移动端状态
  const getIsMobile = useCallback((): boolean => {
    if (!isClient) return false;
    return window.innerWidth <= 768;
  }, [isClient]);

  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile);

  useEffect(() => {
    if (!isClient) return;

    let timeoutId: NodeJS.Timeout;

    // 防抖处理resize事件
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newIsMobile = window.innerWidth <= 768;
        // 只在状态真正改变时更新，避免不必要的重新渲染
        setIsMobile(prevIsMobile => {
          if (prevIsMobile !== newIsMobile) {
            return newIsMobile;
          }
          return prevIsMobile;
        });
      }, 150); // 150ms防抖延迟
    };

    // 添加resize事件监听器
    window.addEventListener('resize', handleResize);

    // 初始化时设置正确的状态（处理SSR hydration）
    const initialIsMobile = getIsMobile();
    if (isMobile !== initialIsMobile) {
      setIsMobile(initialIsMobile);
    }

    // 清理函数：移除事件监听器和清除定时器
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [isClient, getIsMobile, isMobile]);

  return isMobile;
};