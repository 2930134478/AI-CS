"use client";

import Image from "next/image";
import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface ScreenshotDisplayProps {
  imageName: string; // 图片文件名，如 "dashboard.png"
  placeholderIcon: LucideIcon;
  placeholderText: string;
  alt: string;
}

/**
 * 截图显示组件
 * 如果图片存在则显示图片，否则显示占位符
 */
export function ScreenshotDisplay({
  imageName,
  placeholderIcon: PlaceholderIcon,
  placeholderText,
  alt,
}: ScreenshotDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imagePath = `/images/screenshots/${imageName}`;

  // 如果图片加载失败，显示占位符
  if (imageError) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="text-center">
          <PlaceholderIcon className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <p className="text-muted-foreground">{placeholderText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
      <Image
        src={imagePath}
        alt={alt}
        fill
        className="object-contain"
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        priority={false}
        unoptimized={false}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="text-center">
            <PlaceholderIcon className="w-16 h-16 text-primary/50 mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
}

