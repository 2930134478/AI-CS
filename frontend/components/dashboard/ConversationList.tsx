"use client";

import { ConversationSummary } from "@/features/agent/types";
import { ConversationListItem } from "./ConversationListItem";

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversationId: number | null;
  onSelect: (id: number) => void;
  searchQuery: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
  searchQuery,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="text-center text-gray-400 mt-8 text-sm">
          {searchQuery ? "未找到匹配的对话" : "暂无对话"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          selected={selectedConversationId === conversation.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

