'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  requireMembership?: boolean;
  imageCount?: number;
}

export function ImageGallery({ images, initialIndex = 0, requireMembership = false, imageCount }: ImageGalleryProps) {
  const t = useTranslations('component.imageGallery');
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pinchStartDistance, setPinchStartDistance] = useState(0);
  const [pinchStartZoom, setPinchStartZoom] = useState(1);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isDoubleTap, setIsDoubleTap] = useState(false);
  const lastTapRef = useRef(0);
  const isDoubleTapRef = useRef(false);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 过滤无效图片URL
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const totalImages = imageCount || validImages.length;

  // 确保 currentIndex 不越界
  useEffect(() => {
    if (validImages.length > 0 && currentIndex >= validImages.length) {
      setCurrentIndex(0);
    }
  }, [validImages.length, currentIndex]);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setIsOpen(true);
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [validImages.length]);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // 双击放大 - 使用 ref 防止状态更新延迟问题
  const handleDoubleClick = useCallback(() => {
    // 如果正在处理双击，忽略后续调用
    if (isDoubleTapRef.current) return;

    isDoubleTapRef.current = true;
    setIsDoubleTap(true);

    // 切换缩放
    if (zoomLevel > 1) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoomLevel(2);
    }

    // 清除之前的定时器
    if (doubleTapTimerRef.current) {
      clearTimeout(doubleTapTimerRef.current);
    }

    // 500ms 后重置双击标志
    doubleTapTimerRef.current = setTimeout(() => {
      isDoubleTapRef.current = false;
      setIsDoubleTap(false);
    }, 500);
  }, [zoomLevel]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoomLevel, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      e.preventDefault();
      e.stopPropagation();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const maxOffset = (zoomLevel - 1) * (isMobile ? 200 : 500);
      const clampedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
      const clampedY = Math.max(-maxOffset, Math.min(maxOffset, newY));

      setPosition({ x: clampedX, y: clampedY });
    }
  }, [isDragging, zoomLevel, dragStart.x, dragStart.y, isMobile]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 滑动手势处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now();

    // 双指缩放：只有 changedTouches 长度为 1 且 touches 长度为 2 时才是第二根手指放下
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsDragging(false);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStartDistance(distance);
      setPinchStartZoom(zoomLevel);
      // 重置双击时间戳，避免双指抬起后被误判为双击
      lastTapRef.current = 0;
      return;
    }

    // 单指操作：只有 touches 长度为 1 时才处理
    if (e.touches.length !== 1) {
      return;
    }

    const touch = e.touches[0];

    // 双击检测 - 300ms 内两次单指触摸
    if (now - lastTapRef.current < 300) {
      // 立即标记为正在双击，阻止后续操作
      isDoubleTapRef.current = true;
      setIsDoubleTap(true);

      // 双击时切换缩放
      if (zoomLevel > 1) {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setZoomLevel(2);
      }

      lastTapRef.current = 0; // 重置时间戳

      // 清除之前的定时器
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current);
      }

      // 500ms 后重置双击标志
      doubleTapTimerRef.current = setTimeout(() => {
        isDoubleTapRef.current = false;
        setIsDoubleTap(false);
      }, 500);

      return; // 双击时不执行其他操作
    }

    // 记录单指触摸时间戳和位置
    lastTapRef.current = now;
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);

    // 已缩放状态下单指拖动
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  }, [zoomLevel, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 始终阻止默认行为以避免页面滚动
    if (zoomLevel > 1 || e.touches.length === 2) {
      e.preventDefault();
    }

    if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      // 移动端使用更大的拖动范围
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || 300;
      const containerHeight = container?.clientHeight || 500;
      const maxOffsetX = (zoomLevel - 1) * containerWidth * 0.4;
      const maxOffsetY = (zoomLevel - 1) * containerHeight * 0.4;
      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
      const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));

      setPosition({ x: clampedX, y: clampedY });
    } else if (e.touches.length === 2 && pinchStartDistance > 0) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      // 平滑缩放：基于初始缩放比例计算新的缩放级别
      const scaleRatio = currentDistance / pinchStartDistance;
      let newZoom = pinchStartZoom * scaleRatio;

      // 限制缩放范围
      newZoom = Math.max(1, Math.min(3, newZoom));

      // 如果缩放到1，重置位置
      if (newZoom <= 1.05) {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setZoomLevel(newZoom);
      }
    }
  }, [isDragging, zoomLevel, dragStart, pinchStartDistance, pinchStartZoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // 如果正在处理双击，不执行滑动切换
    if (isDoubleTapRef.current) {
      setIsDragging(false);
      setPinchStartDistance(0);
      setPinchStartZoom(1);
      // 如果还有手指在屏幕上，不清空时间戳；如果全部抬起，清空时间戳
      if (e.touches.length === 0) {
        lastTapRef.current = 0;
      }
      return;
    }

    // 双指操作结束时不触发滑动切换
    if (pinchStartDistance > 0) {
      setIsDragging(false);
      setPinchStartDistance(0);
      setPinchStartZoom(1);
      lastTapRef.current = 0;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // 水平滑动切换图片（仅在未缩放时）
    if (zoomLevel === 1 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }

    setIsDragging(false);
    setPinchStartDistance(0);
    setPinchStartZoom(1);
  }, [touchStartX, touchStartY, zoomLevel, goToPrevious, goToNext, pinchStartDistance]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      if (zoomLevel === 1) goToPrevious();
      else setPosition(prev => ({ ...prev, x: prev.x + 50 }));
    } else if (e.key === 'ArrowRight') {
      if (zoomLevel === 1) goToNext();
      else setPosition(prev => ({ ...prev, x: prev.x - 50 }));
    } else if (e.key === 'ArrowUp' && zoomLevel > 1) {
      setPosition(prev => ({ ...prev, y: prev.y + 50 }));
    } else if (e.key === 'ArrowDown' && zoomLevel > 1) {
      setPosition(prev => ({ ...prev, y: prev.y - 50 }));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === '+' || e.key === '=') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  }, [zoomLevel, zoomIn, zoomOut, goToPrevious, goToNext]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      requestAnimationFrame(() => {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      });
    }
  }, [isOpen]);

  if (!validImages || validImages.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {validImages.map((image, index) => (
          <button
            key={index}
            onClick={() => openGallery(index)}
            className="relative aspect-3/4 overflow-hidden rounded-lg group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary bg-muted"
          >
            <Image
              src={image}
              alt={`Image ${index + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 m-0 w-full h-full p-0 bg-black/75 border-0 rounded-none"
            onKeyDown={handleKeyDown}
          >
            <VisuallyHidden>
              <DialogTitle>{t('preview')}</DialogTitle>
            </VisuallyHidden>
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">

              {/* 关闭按钮 - 移动端右上角 */}
              <Button
                variant="ghost"
                size={isMobile ? "default" : "icon"}
                className={`absolute z-50 text-white hover:bg-white/20 cursor-pointer ${isMobile ? 'top-2 right-2 h-10 w-10' : 'top-4 right-4'}`}
                onClick={() => setIsOpen(false)}
              >
                <X className={isMobile ? "h-6 w-6" : "h-6 w-6"} />
              </Button>

              {/* 左右导航按钮 - PC端显示，移动端通过滑动手势 */}
              {!isMobile && zoomLevel === 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12 cursor-pointer"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12 cursor-pointer"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* 移动端底部导航提示 */}
              {isMobile && zoomLevel === 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-xs z-40">
                  ← 滑动切换 →
                </div>
              )}

              <div
                className="relative w-full h-full flex items-center justify-center"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                style={{
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  touchAction: 'none',
                }}
              >
                <div
                  className="relative transition-transform duration-100 ease-out"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                  }}
                >
                  {validImages[currentIndex] && (
                    <Image
                      src={validImages[currentIndex]}
                      alt={`Image ${currentIndex + 1}`}
                      width={2000}
                      height={2000}
                      className={`object-contain pointer-events-none ${isMobile ? 'max-w-[95vw] max-h-[80vh]' : 'max-w-[90vw] max-h-[90vh]'}`}
                      priority
                      draggable={false}
                      quality={100}
                    />
                  )}
                </div>
              </div>

              {/* 底部工具栏 */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent pb-4 pt-8 px-4">
                <div className="flex flex-col items-center gap-2">
                  {/* 缩放控制 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8 cursor-pointer"
                      onClick={zoomOut}
                      disabled={zoomLevel === 1}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white text-xs sm:text-sm bg-black/50 px-2 sm:px-3 py-1 rounded-full min-w-[50px] sm:min-w-[60px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8 cursor-pointer"
                      onClick={zoomIn}
                      disabled={zoomLevel === 3}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    {zoomLevel > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-8 w-8 cursor-pointer"
                        onClick={resetZoom}
                        title={t('reset')}
                      >
                        <Move className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* 会员提示 */}
                  {requireMembership && (
                    <div className="text-white text-xs sm:text-sm bg-amber-500/80 px-3 py-1 rounded-full">
                      {t('requireMembership')}
                    </div>
                  )}

                  {/* 页码显示 */}
                  <div className="text-white text-xs sm:text-sm bg-black/50 px-3 py-1 rounded-full">
                    {currentIndex + 1} / {totalImages}
                  </div>

                  {/* 移动端导航按钮 */}
                  {isMobile && zoomLevel === 1 && (
                    <div className="flex items-center gap-8 mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-12 w-12 cursor-pointer"
                        onClick={goToPrevious}
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-12 w-12 cursor-pointer"
                        onClick={goToNext}
                      >
                        <ChevronRight className="h-8 w-8" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    </>
  );
}
