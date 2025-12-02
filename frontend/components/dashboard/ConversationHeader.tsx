"use client";

import { Separator } from "@/components/ui/separator";

export type ConversationFilter = "all" | "mine" | "others";

interface ConversationHeaderProps {
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
}

export function ConversationHeader({
  filter,
  onFilterChange,
}: ConversationHeaderProps) {
  const getFilterLabel = (f: ConversationFilter) => {
    switch (f) {
      case "all":
        return "全部";
      case "mine":
        return "自己的";
      case "others":
        return "其他的";
      default:
        return "全部";
    }
  };

  return (
    <div className="h-16 flex items-center justify-between px-4 bg-background flex-shrink-0 relative">
      <div className="flex items-center gap-1 relative">
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as ConversationFilter)}
          className="font-semibold text-foreground bg-transparent border-none outline-none cursor-pointer appearance-none pr-6 min-w-fit"
        >
          <option value="all">All chats</option>
          <option value="mine">My chats</option>
          <option value="others">Others chats</option>
        </select>
        <svg
          className="w-4 h-4 text-muted-foreground pointer-events-none flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <Separator className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}

