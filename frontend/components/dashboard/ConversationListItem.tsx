"use client";

import { ConversationSummary } from "@/features/agent/types";
import {
  buildMessagePreview,
  formatConversationTime,
  isVisitorOnline,
} from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ConversationListItemProps {
  conversation: ConversationSummary;
  selected: boolean;
  onSelect: (id: number) => void;
}

export function ConversationListItem({
  conversation,
  selected,
  onSelect,
}: ConversationListItemProps) {
  const avatarColor = `hsl(${(conversation.id * 137.5) % 360}, 70%, 50%)`;
  const unreadCount = conversation.unread_count ?? 0;
  const lastMessage = conversation.last_message;
  const lastMessagePreview = lastMessage
    ? buildMessagePreview(lastMessage.content)
    : "暂无消息";
  // 根据 last_seen_at 判断是否在线（最近 10 秒内认为在线）
  const isOnline = isVisitorOnline(conversation.last_seen_at);

  return (
    <Card
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect(conversation.id);
      }}
      onMouseDown={(event) => {
        if (event.button === 0) {
          event.preventDefault();
        }
      }}
      className={`p-4 mb-2 cursor-pointer transition-all select-none border-0 shadow-sm hover:shadow-md ${
        selected
          ? "bg-primary/5 border-l-4 border-l-primary shadow-md"
          : "hover:bg-accent/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {conversation.visitor_id.toString().slice(-2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground text-sm truncate">
              对话 #{conversation.id}
            </span>
            {/* 在线/离线状态图标 */}
            {isOnline && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                title="在线"
                style={{ backgroundColor: "#10b981" }}
              />
            )}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="flex-shrink-0">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            <Badge
              variant={conversation.status === "open" ? "default" : "secondary"}
              className="flex-shrink-0"
            >
              {conversation.status === "open" ? "进行中" : "已关闭"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            {lastMessage?.sender_is_agent && (
              <span
                className={`text-[10px] ${
                  lastMessage.is_read ? "text-primary/70" : "text-muted-foreground"
                }`}
              >
                {lastMessage.is_read ? "✓✓" : "✓"}
              </span>
            )}
            <span className="truncate">{lastMessagePreview}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>访客 #{conversation.visitor_id}</span>
            <span>{formatConversationTime(conversation.updated_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

