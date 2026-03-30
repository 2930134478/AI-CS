"use client";

import { ConversationSummary } from "@/features/agent/types";
import { ConversationHeader, type ConversationFilter } from "./ConversationHeader";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationList } from "./ConversationList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type ConversationStatus = "open" | "closed";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  selectedConversationId: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (id: number) => void;
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  status?: ConversationStatus;
  onStatusChange?: (status: ConversationStatus) => void;
  /** 内部对话（知识库测试）模式：显示「新建内部对话」按钮，隐藏筛选 */
  mode?: "visitor" | "internal";
  onNewClick?: () => void;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  filter,
  onFilterChange,
  status = "open",
  onStatusChange,
  mode = "visitor",
  onNewClick,
}: ConversationSidebarProps) {
  return (
    <div className="w-80 min-w-0 flex-1 flex flex-col bg-white border-r border-gray-200 min-h-0 overflow-hidden">
      {mode === "internal" ? (
        <div className="h-14 flex items-center justify-between px-3 border-b border-border bg-background flex-shrink-0">
          <span className="text-sm font-medium text-foreground truncate">知识库测试</span>
          {onNewClick && (
            <Button size="sm" variant="outline" onClick={onNewClick} className="flex-shrink-0 gap-1">
              <Plus className="w-4 h-4" />
              新建
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <ConversationHeader filter={filter} onFilterChange={onFilterChange} />
          <div className="px-3 pb-2 flex items-center gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs border transition ${
                status === "open"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
              onClick={() => onStatusChange?.("open")}
            >
              进行中
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs border transition ${
                status === "closed"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
              onClick={() => onStatusChange?.("closed")}
            >
              历史
            </button>
          </div>
        </div>
      )}
      <div className="flex-shrink-0 px-2 min-w-0">
        <ConversationSearch value={searchQuery} onChange={onSearchChange} />
      </div>
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelect={onSelectConversation}
        searchQuery={searchQuery}
      />
    </div>
  );
}

