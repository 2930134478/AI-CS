"use client";

import { useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

import { ConversationSummary } from "@/features/agent/types";
import { ConversationListItem } from "./ConversationListItem";
import { Button } from "@/components/ui/button";

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversationId: number | null;
  onSelect: (id: number) => void;
  searchQuery: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
  searchQuery,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: ConversationListProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || searchQuery.trim() || !onLoadMore) {
      return;
    }
    onLoadMore();
  }, [hasMore, loadingMore, onLoadMore, searchQuery]);

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !onLoadMore || searchQuery.trim()) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore();
        }
      },
      { root, rootMargin: "120px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, onLoadMore, searchQuery, conversations.length]);

  if (conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-auto">
        <div className="text-center text-muted-foreground mt-8 text-sm">
          {searchQuery ? "未找到匹配的对话" : "暂无对话"}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRootRef}
      className="flex-1 overflow-y-auto px-2 py-2 scrollbar-auto min-h-0"
    >
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          selected={selectedConversationId === conversation.id}
          onSelect={onSelect}
        />
      ))}

      {!searchQuery.trim() && hasMore ? (
        <div ref={sentinelRef} className="py-3 flex justify-center">
          {loadingMore ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Button variant="ghost" size="sm" onClick={handleLoadMore}>
              加载更多
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
