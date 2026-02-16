'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
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
  
  const totalImages = imageCount || images.length;
  const remainingImages = totalImages - (currentIndex + 1);

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setZoomLevel(1);
    setIsOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === '+') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const [touchStartDistance, setTouchStartDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (touchStartDistance > 0) {
        const scaleFactor = currentDistance / touchStartDistance;
        if (scaleFactor > 1.1) {
          zoomIn();
          setTouchStartDistance(currentDistance);
        } else if (scaleFactor < 0.9) {
          zoomOut();
          setTouchStartDistance(currentDistance);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDistance(0);
  };

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

      <Dialog open={isOpen} onOpenChange={setIsOpen} >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 m-0 w-full h-full p-0 bg-black/95 border-0 rounded-none cursor-pointer"
            onKeyDown={handleKeyDown}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <VisuallyHidden>
              <DialogTitle>图片预览</DialogTitle>
            </VisuallyHidden>
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Breadcrumb Navigation */}
              <div className="absolute top-4 left-4 z-50 text-white text-sm">
                <div className="flex items-center gap-2">
                  <span>首页</span>
                  <span> / </span>
                  <span>文章</span>
                  <span> / </span>
                  <span>图片 {currentIndex + 1} / {totalImages}</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

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
                className="absolute top-12 left-4 z-50 text-white hover:bg-white/20 cursor-pointer"
                onClick={zoomOut}
              >
                <ZoomOut className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-12 left-16 z-50 text-white hover:bg-white/20 cursor-pointer"
                onClick={resetZoom}
              >
                <span className="text-sm">100%</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-12 left-28 z-50 text-white hover:bg-white/20 cursor-pointer"
                onClick={zoomIn}
              >
                <ZoomIn className="h-6 w-6" />
              </Button>

              <div className="relative w-full h-full flex items-center justify-center">
                <div 
                  className="relative transition-transform duration-200 ease-in-out"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <Image
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    width={2000}
                    height={2000}
                    className="max-w-[90vw] max-h-[90vh] object-contain"
                    priority
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12 cursor-pointer"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                {requireMembership && (
                  <div className="text-white text-sm bg-amber-500/80 px-3 py-1 rounded-full">
                    需要会员
                  </div>
                )}
                <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full flex items-center gap-4">
                  <span>{currentIndex + 1} / {totalImages}</span>
                  {/* <span>剩余 {remainingImages} 张</span> */}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    </>
  );
}
