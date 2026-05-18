"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChatWidget } from "@/components/visitor/ChatWidget";
import { FloatingButton } from "@/components/visitor/FloatingButton";
import { isChatEmbedMode } from "@/lib/chat-embed";

/**
 * 访客聊天页面
 * - 独立打开：右下角浮动按钮 + 聊天小窗
 * - iframe / ?embed=1：直接铺满，供宿主站点一次点击打开 iframe 即可使用
 */
export default function ChatPage() {
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const embedded = useSyncExternalStore(
    () => () => {},
    () => isChatEmbedMode(),
    () => false
  );

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

  const loadingShell = embedded ? "h-[100dvh] w-full" : "min-h-screen";

  if (visitorId === null) {
    return (
      <div className={`flex items-center justify-center ${loadingShell} bg-muted/30 text-muted-foreground`}>
        正在初始化...
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-white">
        <ChatWidget
          visitorId={visitorId}
          isOpen
          embedded
          onToggle={() => {}}
        />
      </div>
    );
  }

  return (
    <>
      <FloatingButton onClick={handleToggle} isOpen={isOpen} />
      {isOpen && (
        <ChatWidget visitorId={visitorId} isOpen={isOpen} onToggle={handleToggle} />
      )}
    </>
  );
}
