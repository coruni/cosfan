'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import AvatarEditor from 'react-avatar-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, RotateCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  aspectRatio?: number;
  width?: number;
  height?: number;
  onConfirm: (file: File) => Promise<void> | void;
  initialImage?: string;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  title = '裁剪图片',
  description = '拖拽调整位置，滚轮或双指缩放',
  aspectRatio = 1,
  width = 200,
  height = 200,
  onConfirm,
  initialImage,
}: ImageCropDialogProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
    }
  }, [initialImage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setScale(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setScale(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(1, Math.min(3, prev + delta)));
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const container = containerRef.current;
      if (container) {
        const lastDistance = (container as any)._lastTouchDistance || distance;
        const delta = (distance - lastDistance) * 0.005;
        setScale((prev) => Math.max(1, Math.min(3, prev + delta)));
        (container as any)._lastTouchDistance = distance;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      (container as any)._lastTouchDistance = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container && image) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [image, handleWheel, handleTouchMove, handleTouchEnd]);

  const handleConfirm = async () => {
    if (!editorRef.current || !image) {
      toast.error('请先选择图片');
      return;
    }

    const canvas = editorRef.current.getImageScaledToCanvas();
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('图片处理失败');
        return;
      }

      const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
      
      setIsLoading(true);
      try {
        await onConfirm(file);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || '上传失败');
      } finally {
        setIsLoading(false);
      }
    }, 'image/png', 0.9);
  };

  const handleClose = () => {
    setImage(null);
    setScale(1);
    setRotation(0);
    onOpenChange(false);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!image ? (
            <div
              ref={containerRef}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                点击或拖拽图片到此处上传
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持 JPG、PNG、GIF 格式
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                ref={containerRef}
                className="flex justify-center bg-muted rounded-lg p-2 touch-none select-none"
              >
                <AvatarEditor
                  ref={editorRef}
                  image={image}
                  width={width}
                  height={height}
                  border={0}
                  color={[0, 0, 0, 0.6]}
                  scale={scale}
                  rotate={rotation}
                  borderRadius={aspectRatio === 1 ? Math.min(width, height) / 2 : 0}
                />
              </div>

              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotateLeft}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  向左旋转
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotateRight}
                >
                  <RotateCw className="h-4 w-4 mr-1 scale-x-[-1]" />
                  向右旋转
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                滚轮或双指缩放 · 拖拽调整位置
              </p>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                重新选择图片
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!image || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
