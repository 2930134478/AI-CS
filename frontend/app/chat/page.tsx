"use client";

import { useEffect, useState } from "react";
import { ChatWidget } from "@/components/visitor/ChatWidget";
import { FloatingButton } from "@/components/visitor/FloatingButton";

/**
 * 访客聊天页面
 * 使用小窗插件形式，显示浮动按钮和聊天小窗
 */
export default function ChatPage() {
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 初始化访客 ID（使用 localStorage 保持连续性）
  useEffect(() => {
    let stored = window.localStorage.getItem("visitor_id");
    if (!stored) {
      stored = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
      window.localStorage.setItem("visitor_id", stored);
    }
    const parsed = Number.parseInt(stored, 10);
    setVisitorId(Number.isNaN(parsed) ? null : parsed);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  if (visitorId === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30 text-muted-foreground">
        正在初始化...
      </div>
    );
  }

  return (
    <>
      {/* 浮动按钮 */}
      <FloatingButton onClick={handleToggle} isOpen={isOpen} />
      {/* 聊天小窗 */}
      {isOpen && (
        <ChatWidget visitorId={visitorId} isOpen={isOpen} onToggle={handleToggle} />
      )}
    </>
  );
}
