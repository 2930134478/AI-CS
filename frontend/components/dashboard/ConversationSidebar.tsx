"use client";

import { ConversationSummary } from "@/features/agent/types";
import { ConversationHeader, type ConversationFilter } from "./ConversationHeader";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationList } from "./ConversationList";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  selectedConversationId: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (id: number) => void;
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  filter,
  onFilterChange,
}: ConversationSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
      <ConversationHeader filter={filter} onFilterChange={onFilterChange} />
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

