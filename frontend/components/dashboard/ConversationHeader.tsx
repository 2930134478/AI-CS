"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export type ConversationFilter = "all" | "mine" | "others";

interface ConversationHeaderProps {
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
}

const FILTER_OPTIONS: { value: ConversationFilter; label: string }[] = [
  { value: "all", label: "全部对话" },
  { value: "mine", label: "我的对话" },
  { value: "others", label: "他人对话" },
];

export function ConversationHeader({
  filter,
  onFilterChange,
}: ConversationHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? "全部对话";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="h-14 flex items-center px-3 border-b border-border bg-background flex-shrink-0">
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium text-foreground transition-colors min-w-0"
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 py-1 rounded-lg border border-border bg-popover shadow-md z-50 min-w-[theme(spacing.32)]">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onFilterChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  filter === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

