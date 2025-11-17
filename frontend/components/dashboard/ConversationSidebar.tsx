"use client";

import { ConversationSummary } from "@/features/agent/types";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationList } from "./ConversationList";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  selectedConversationId: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (id: number) => void;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
}: ConversationSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
      <ConversationHeader />
      <ConversationSearch value={searchQuery} onChange={onSearchChange} />
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelect={onSelectConversation}
        searchQuery={searchQuery}
      />
    </div>
  );
}

