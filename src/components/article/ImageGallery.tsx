'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Move, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalImages = imageCount || images.length;

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
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

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

  // 双击放大
  const handleDoubleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (zoomLevel > 1) {
      resetZoom();
    } else {
      setZoomLevel(2);
    }
  }, [zoomLevel]);

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
  }, [isDragging, zoomLevel, dragStart, isMobile]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 滑动手势处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const touch = e.touches[0];

    // 双击检测
    if (now - lastTap < 300) {
      if (zoomLevel > 1) {
        resetZoom();
      } else {
        setZoomLevel(2);
      }
      setLastTap(0);
      return;
    }
    setLastTap(now);

    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);

    if (e.touches.length === 1 && zoomLevel > 1) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      e.stopPropagation();
      setIsDragging(false);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStartDistance(distance);
    }
  }, [zoomLevel, position, lastTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      e.stopPropagation();
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      const maxOffset = (zoomLevel - 1) * (isMobile ? 200 : 500);
      const clampedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
      const clampedY = Math.max(-maxOffset, Math.min(maxOffset, newY));

      setPosition({ x: clampedX, y: clampedY });
    } else if (e.touches.length === 2 && pinchStartDistance > 0) {
      e.stopPropagation();
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const scaleFactor = currentDistance / pinchStartDistance;
      if (scaleFactor > 1.1) {
        zoomIn();
        setPinchStartDistance(currentDistance);
      } else if (scaleFactor < 0.9) {
        zoomOut();
        setPinchStartDistance(currentDistance);
      }
    }
  }, [isDragging, zoomLevel, dragStart, pinchStartDistance, zoomOut, isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
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
  }, [touchStartX, touchStartY, zoomLevel, goToPrevious, goToNext]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomOut]);

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
  }, [zoomLevel, zoomOut, goToPrevious, goToNext]);

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
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {images.map((image, index) => (
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
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 m-0 w-full h-full p-0 bg-black border-0 rounded-none"
            onKeyDown={handleKeyDown}
          >
            <VisuallyHidden>
              <DialogTitle>{t('preview')}</DialogTitle>
            </VisuallyHidden>
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none">

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
                style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                <div
                  className="relative transition-transform duration-100 ease-out"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                  }}
                >
                  <Image
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    width={2000}
                    height={2000}
                    className={`object-contain pointer-events-none ${isMobile ? 'max-w-[95vw] max-h-[80vh]' : 'max-w-[90vw] max-h-[90vh]'}`}
                    priority
                    draggable={false}
                    quality={100}
                  />
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
