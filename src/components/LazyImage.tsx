"use client"
import { useState, useCallback } from 'react';

interface LazyImageProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string; // 加载失败时的占位图
  placeholder?: React.ReactNode; // 自定义加载中占位符
}

const LazyImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fallbackSrc = '/placeholder-error.png', // 默认错误占位图
  placeholder
}: LazyImageProps) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleError = useCallback(() => {
    setImageState('error');
    setCurrentSrc(fallbackSrc);
  }, [fallbackSrc]);

  // 默认加载中占位符
  const defaultPlaceholder = (
    <img 
      src="/placeholder-error.png"
      alt="Loading..."
      width={width}
      height={height}
      className={`bg-gray-200 ${className}`}
    />
  );

  // 加载失败占位符
  const errorPlaceholder = (
    <img 
      src="/placeholder-error.png"
      alt="failed"
      width={width}
      height={height}
      className={`bg-gray-100 ${className}`}
    />
  );

  return (
    <div className="relative flex-shrink-0">
      {/* 加载中状态 */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 z-10">
          {placeholder || defaultPlaceholder}
        </div>
      )}
      
      {/* 图片 */}
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`transition-opacity duration-300 object-cover ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...(imageState === 'loading' && { visibility: 'hidden' })
        }}
      />
      
      {/* 错误状态显示占位符 */}
      {imageState === 'error' && (
        <div className="absolute inset-0">
          {errorPlaceholder}
        </div>
      )}
    </div>
  );
};

export default LazyImage;