"use client";

import { formatConversationTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ChatHeaderProps {
  conversationId: number;
  lastSeenAt?: string | null;
  unreadCount: number;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  includeAIMessages?: boolean;
  onToggleAIMessages?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  hideAIToggle?: boolean; // 内部对话时隐藏「显示 AI 消息」切换
}

export function ChatHeader({
  conversationId,
  lastSeenAt,
  unreadCount,
  onMarkAllRead,
  onRefresh,
  includeAIMessages = false,
  onToggleAIMessages,
  soundEnabled = false,
  onToggleSound,
  hideAIToggle = false,
}: ChatHeaderProps) {
  return (
    <div className="h-16 flex items-center justify-between px-4 bg-background flex-shrink-0 relative">
      <div className="z-10">
        <div className="font-semibold text-foreground">对话 #{conversationId}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {lastSeenAt
            ? `last seen ${formatConversationTime(lastSeenAt)}`
            : "last seen 未知"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* 显示/隐藏 AI 消息切换按钮（内部对话不显示，默认始终包含 AI 消息） */}
        {onToggleAIMessages && !hideAIToggle && (
          <Button
            variant={includeAIMessages ? "default" : "outline"}
            size="sm"
            onClick={onToggleAIMessages}
            title={includeAIMessages ? "隐藏 AI 消息" : "显示 AI 消息"}
            className="text-xs"
          >
            {includeAIMessages ? "隐藏 AI 消息" : "显示 AI 消息"}
          </Button>
        )}
        {/* 声音开关按钮 */}
        {onToggleSound && (
          <Button
            variant="ghost"
            size="icon"
            title={soundEnabled ? "关闭声音提示" : "开启声音提示"}
            onClick={onToggleSound}
          >
            {soundEnabled ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          title="标记全部已读"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="刷新"
          onClick={onRefresh}
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </Button>
      </div>
      <Separator className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}

