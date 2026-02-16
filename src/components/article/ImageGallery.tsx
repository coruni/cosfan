'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
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
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const totalImages = imageCount || images.length;

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setIsOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

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
      
      const maxOffset = (zoomLevel - 1) * 500;
      const clampedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
      const clampedY = Math.max(-maxOffset, Math.min(maxOffset, newY));
      
      setPosition({ x: clampedX, y: clampedY });
    }
  }, [isDragging, zoomLevel, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel > 1) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
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
  }, [zoomLevel, position]);

  const [pinchStartDistance, setPinchStartDistance] = useState(0);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      e.stopPropagation();
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      const maxOffset = (zoomLevel - 1) * 500;
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
  }, [isDragging, zoomLevel, dragStart, pinchStartDistance, zoomOut]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setPinchStartDistance(0);
  }, []);

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
  }, [zoomLevel, zoomOut]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

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
            className="relative aspect-[3/4] overflow-hidden rounded-lg group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
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
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 m-0 w-full h-full p-0 bg-black/90 border-0 rounded-none"
            onKeyDown={handleKeyDown}
          >
            <VisuallyHidden>
              <DialogTitle>图片预览</DialogTitle>
            </VisuallyHidden>
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {zoomLevel === 1 && (
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

              <div 
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
                    className="max-w-[90vw] max-h-[90vh] object-contain pointer-events-none"
                    priority
                    draggable={false}
                  />
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
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
                  <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full min-w-[60px] text-center">
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
                      title="重置"
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {requireMembership && (
                  <div className="text-white text-sm bg-amber-500/80 px-3 py-1 rounded-full">
                    需要会员
                  </div>
                )}
                <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {currentIndex + 1} / {totalImages}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    </>
  );
}
