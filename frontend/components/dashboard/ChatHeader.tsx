"use client";

import { formatConversationTime } from "@/utils/format";

interface ChatHeaderProps {
  conversationId: number;
  lastSeenAt?: string | null;
  unreadCount: number;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

export function ChatHeader({
  conversationId,
  lastSeenAt,
  unreadCount,
  onMarkAllRead,
  onRefresh,
}: ChatHeaderProps) {
  return (
    <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      <div>
        <div className="font-semibold text-gray-800">对话 #{conversationId}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {lastSeenAt
            ? `last seen ${formatConversationTime(lastSeenAt)}`
            : "last seen 未知"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            unreadCount > 0
              ? "hover:bg-gray-100 text-gray-600"
              : "text-gray-300 cursor-not-allowed"
          }`}
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
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
          title="刷新"
          onClick={onRefresh}
        >
          <svg
            className="w-5 h-5 text-gray-600"
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
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
          title="更多选项"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

