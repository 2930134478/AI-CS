"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
  className = "",
}: {
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "icon" | "default";
  className?: string;
}) {
  const { lang, setLang } = useI18n();

  const next = useMemo<Lang>(() => (lang === "zh-CN" ? "en" : "zh-CN"), [lang]);
  const label = lang === "zh-CN" ? "EN" : "中文";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => setLang(next)}
      className={className}
      aria-label="Language"
      title="Language"
    >
      {label}
    </Button>
  );
}

