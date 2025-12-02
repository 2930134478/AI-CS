"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FloatingButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  unreadCount?: number;
}

/**
 * 浮动按钮组件
 * 显示在页面右下角，用于打开聊天小窗
 */
export function FloatingButton({
  onClick,
  isOpen = false,
  unreadCount = 0,
}: FloatingButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center p-0"
      aria-label={isOpen ? "关闭聊天" : "打开聊天"}
    >
      {isOpen ? (
        // 关闭图标（X）
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        // 聊天图标
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
      {/* 未读消息数量徽章 */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );
}

