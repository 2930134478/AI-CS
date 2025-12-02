"use client";

import { Input } from "@/components/ui/input";

interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ConversationSearch({
  value,
  onChange,
}: ConversationSearchProps) {
  return (
    <div className="p-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Q Search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full pl-9"
        />
        <svg
          className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}

