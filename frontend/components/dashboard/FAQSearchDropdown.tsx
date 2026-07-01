"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FAQQuickResult } from "@/features/agent/services/faqApi";
import { quickSearchFAQs } from "@/features/agent/services/faqApi";
import { Loader2, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

interface FAQSearchDropdownProps {
  open: boolean;
  onClose: () => void;
  onSelect: (faq: FAQQuickResult) => void;
}

export function FAQSearchDropdown({
  open,
  onClose,
  onSelect,
}: FAQSearchDropdownProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FAQQuickResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setError(null);
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setError(null);
      setSelectedIndex(-1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await quickSearchFAQs(q.trim(), 10);
      setResults(data);
      setSelectedIndex(data.length > 0 ? 0 : -1);
    } catch (err) {
      setError((err as Error).message || "搜索失败");
      setResults([]);
      setSelectedIndex(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(value), 300);
    },
    [doSearch]
  );

  const handleSelect = useCallback(
    (faq: FAQQuickResult) => {
      onSelect(faq);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            results.length === 0 ? -1 : Math.min(results.length - 1, prev + 1)
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(0, prev - 1));
          break;
        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            event.preventDefault();
            handleSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, handleSelect, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-4 right-4 mb-2 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-[380px] flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/50 flex-shrink-0">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("agent.faqs.quickSearch.placeholder")}
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
        />
        <kbd
          className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground cursor-pointer flex-shrink-0"
          onClick={onClose}
        >
          Esc
        </kbd>
      </div>

      <div className="overflow-y-auto flex-1 min-h-[60px]">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("agent.faqs.quickSearch.searching")}
          </div>
        )}

        {error && (
          <div className="text-center py-6 text-sm text-destructive px-4">
            {error}
          </div>
        )}

        {!loading && !error && query.trim() && results.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {t("agent.faqs.quickSearch.noResults")}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="py-1">
            {results.map((faq, index) => (
              <button
                key={faq.id}
                type="button"
                onClick={() => handleSelect(faq)}
                className={`w-full text-left px-4 py-2.5 transition-colors cursor-pointer ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60"
                }`}
              >
                <div className="font-medium text-sm line-clamp-1">
                  {faq.question}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {faq.answer}
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !query.trim() && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {t("agent.faqs.quickSearch.startTyping")}
          </div>
        )}
      </div>
    </div>
  );
}
