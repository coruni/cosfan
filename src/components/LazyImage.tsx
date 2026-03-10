'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { useNetwork, getRecommendedQuality } from '@/hooks/useNetwork';

interface LazyImageProps extends Omit<ImageProps, 'onLoad' | 'onError' | 'placeholder'> {
  /**
   * Loading placeholder type
   */
  placeholder?: 'blur' | 'empty';
  /**
   * Enable progressive loading
   */
  progressiveLoading?: boolean;
  /**
   * Low quality image URL (for progressive loading)
   */
  lowQualitySrc?: string;
  /**
   * Fallback image URL on error
   */
  fallbackSrc?: string;
  /**
   * Custom loading text
   */
  loadingText?: string;
  /**
   * Error text
   */
  errorText?: string;
  /**
   * onLoad callback
   */
  onLoad?: () => void;
  /**
   * onError callback
   */
  onError?: (error: Error) => void;
}

interface ImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
}

/**
 * 懒加载图片组件
 * 支持弱网优化：渐进式加载、错误重试、网络状态适配
 */
export function LazyImage({
  src,
  alt,
  placeholder = 'blur',
  progressiveLoading = true,
  lowQualitySrc,
  fallbackSrc,
  loadingText,
  errorText,
  className,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const { effectiveType, saveData, isOffline } = useNetwork();
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: true,
    isLoaded: false,
    hasError: false,
  });
  const [currentSrc, setCurrentSrc] = useState<string>(lowQualitySrc || src);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const maxRetries = 3;

  // 根据网络状况调整图片质量
  const quality = getRecommendedQuality(effectiveType as any, saveData);

  // 处理图片加载完成
  const handleLoad = useCallback(() => {
    setImageState({
      isLoading: false,
      isLoaded: true,
      hasError: false,
    });

    // 如果有低质量图且加载成功，切换到高质量图
    if (lowQualitySrc && src !== lowQualitySrc && currentSrc !== src) {
      setCurrentSrc(src);
    }

    onLoad?.();
  }, [lowQualitySrc, src, currentSrc, onLoad]);

  // 处理图片加载错误
  const handleError = useCallback(() => {
    if (retryCount < maxRetries) {
      // 重试加载
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        // 添加时间戳强制刷新
        const separator = src.includes('?') ? '&' : '';
        const newSrc = `${src}${separator}_t=${Date.now()}`;
        setCurrentSrc(newSrc);
      }, 1000 * (retryCount + 1));
    } else {
      setImageState({
        isLoading: false,
        isLoaded: false,
        hasError: true,
      });

      // 使用回退图
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setImageState({
          isLoading: false,
          isLoaded: true,
          hasError: false,
        });
      }

      onError?.(new Error('Image load failed'));
    }
  }, [retryCount, src, fallbackSrc, onError]);

  // 监听网络状态变化
  useEffect(() => {
    if (!isOffline && imageState.hasError && retryCount === 0) {
      // 网络恢复时重试加载
      setCurrentSrc(src);
      setImageState(prev => ({ ...prev, isLoading: true }));
    }
  }, [isOffline]);

  // 清理
  useEffect(() => {
    return () => {
      setImageState({ isLoading: false, isLoaded: false, hasError: false });
    };
  }, [src]);

  // 计算 blurDataURL（可选的模糊占位图）
  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAxEPwAB//9k=";

  // 离线状态
  if (isOffline) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center',
          className
        )}
        style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined }}
      >
        <span className="text-muted-foreground text-sm">离线模式</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* 加载状态 */}
      {imageState.isLoading && placeholder !== 'empty' && (
        <div
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10"
        >
          {placeholder === 'blur' ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${blurDataURL})` }}
            />
          ) : null}
          {loadingText && (
            <span className="text-muted-foreground text-xs">{loadingText}</span>
          )}
        </div>
      )}

      {/* 错误状态 */}
      {imageState.hasError && !fallbackSrc && (
        <div
          className="absolute inset-0 bg-muted flex items-center justify-center"
        >
          <span className="text-muted-foreground text-xs">{errorText || '加载失败'}</span>
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={placeholder === 'blur' ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        loading="lazy"
        // 质量根据网络状况调整
        quality={quality === 'low' ? 50 : quality === 'medium' ? 75 : 85}
        {...props}
        className={cn(
          props.className,
          imageState.isLoading && 'invisible'
        )}
      />
    </div>
  );
}

/**
 * 骨架屏图片占位符
 */
export function ImageSkeleton({ className, aspectRatio }: { className?: string; aspectRatio?: string }) {
  return (
    <div
      className={cn(
        'bg-muted animate-pulse rounded-md',
        className
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    />
  );
}