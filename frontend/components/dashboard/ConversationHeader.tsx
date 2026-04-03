"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export type ConversationFilter = "all" | "mine" | "others";

export type ConversationListStatus = "open" | "closed";

interface ConversationHeaderProps {
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  /** 与「全部对话」同一行右侧：进行中 / 历史 */
  listStatus?: ConversationListStatus;
  onListStatusChange?: (status: ConversationListStatus) => void;
}

const FILTER_OPTIONS: { value: ConversationFilter; label: string }[] = [
  { value: "all", label: "全部对话" },
  { value: "mine", label: "我的对话" },
  { value: "others", label: "他人对话" },
];

export function ConversationHeader({
  filter,
  onFilterChange,
  listStatus,
  onListStatusChange,
}: ConversationHeaderProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = [
    { value: "all" as const, label: t("agent.conversations.filter.all") },
    { value: "mine" as const, label: t("agent.conversations.filter.mine") },
    { value: "others" as const, label: t("agent.conversations.filter.others") },
  ];
  const currentLabel =
    options.find((o) => o.value === filter)?.label ??
    t("agent.conversations.filter.all");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const showListStatus =
    listStatus !== undefined && typeof onListStatusChange === "function";

  return (
    <div className="h-14 flex items-center gap-2 px-3 border-b border-border bg-background flex-shrink-0 min-w-0">
      <div className="relative min-w-0 shrink" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium text-foreground transition-colors max-w-[9.5rem] min-w-0"
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 py-1 rounded-lg border border-border bg-popover shadow-md z-50 min-w-[theme(spacing.32)]">
            {options.map((opt) => (
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
      {showListStatus && (
        <div className="ml-auto flex-shrink-0">
          <div className="inline-flex rounded-md border border-border/70 bg-muted/30 p-0.5">
            <button
              type="button"
              className={`px-2.5 py-1 rounded-[0.25rem] text-[11px] font-medium transition leading-none ${
                listStatus === "open"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onListStatusChange!("open")}
            >
              {t("agent.conversations.status.open")}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-[0.25rem] text-[11px] font-medium transition leading-none ${
                listStatus === "closed"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onListStatusChange!("closed")}
            >
              {t("agent.conversations.status.closed")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

