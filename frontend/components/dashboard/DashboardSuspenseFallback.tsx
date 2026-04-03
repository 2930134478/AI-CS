"use client";

import { useI18n } from "@/lib/i18n/provider";

export function DashboardSuspenseFallback() {
  const { t } = useI18n();
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="text-muted-foreground">{t("common.loading")}</div>
    </div>
  );
}
