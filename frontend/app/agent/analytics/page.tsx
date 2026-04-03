"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAnalyticsSummary,
  type AnalyticsDailyRow,
  type AnalyticsSummaryResponse,
} from "@/features/agent/services/analyticsApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";

function formatPercent(n: number) {
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm sm:p-4">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function DailyBars({
  daily,
  field,
  label,
  color,
  emptyLabel,
}: {
  daily: AnalyticsDailyRow[];
  field: keyof Pick<
    AnalyticsDailyRow,
    "widget_opens" | "sessions" | "messages" | "ai_replies"
  >;
  label: string;
  color: string;
  emptyLabel: string;
}) {
  const max = useMemo(() => {
    let m = 1;
    for (const row of daily) {
      const v = Number(row[field]) || 0;
      if (v > m) m = v;
    }
    return m;
  }, [daily, field]);

  if (daily.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="min-w-0">
      <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex h-36 min-w-max items-end gap-1 border-b border-border/40 pb-1">
        {daily.map((row) => {
          const v = Number(row[field]) || 0;
          const h = Math.round((v / max) * 100);
          return (
            <div
              key={row.date}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${row.date}: ${v}`}
            >
              <div
                className="w-full max-w-[28px] rounded-t transition-all"
                style={{
                  height: `${Math.max(h, v > 0 ? 8 : 0)}%`,
                  backgroundColor: color,
                  minHeight: v > 0 ? 4 : 0,
                }}
              />
              <span className="truncate text-[10px] text-muted-foreground">
                {row.date.slice(5)}
              </span>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage(_props: { embedded?: boolean }) {
  const { t } = useI18n();

  const tr = (key: I18nKey, vars?: Record<string, string>) => {
    let s = t(key);
    if (!vars) return s;
    for (const k of Object.keys(vars)) {
      s = s.replaceAll(`{{${k}}}`, vars[k] ?? "");
    }
    return s;
  };

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAnalyticsSummary(from, to);
      setData(res);
    } catch (e) {
      toast.error((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = data?.totals;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-col overflow-auto p-3 sm:p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{t("agent.analytics.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("agent.analytics.subtitle")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:ml-auto">
          <label className="flex items-center gap-2 text-xs text-muted-foreground sm:gap-1">
            <span className="shrink-0">{t("agent.analytics.from")}</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm sm:flex-initial"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground sm:gap-1">
            <span className="shrink-0">{t("agent.analytics.to")}</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm sm:flex-initial"
            />
          </label>
          <Button className="w-full sm:w-auto" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? t("agent.analytics.loading") : t("agent.analytics.query")}
          </Button>
        </div>
      </div>

      {data && (
        <p className="text-xs text-muted-foreground mb-4">{data.note}</p>
      )}

      {totals && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              title={t("agent.analytics.stat.widgetOpens")}
              value={totals.widget_opens}
              sub={t("agent.analytics.stat.widgetOpensSub")}
            />
            <StatCard title={t("agent.analytics.stat.sessions")} value={totals.sessions} />
            <StatCard title={t("agent.analytics.stat.messages")} value={totals.messages} />
            <StatCard title={t("agent.analytics.stat.aiReplies")} value={totals.ai_replies} />
            <StatCard title={t("agent.analytics.stat.aiFailed")} value={totals.ai_failed} />
            <StatCard
              title={t("agent.analytics.stat.aiFailureRate")}
              value={formatPercent(totals.ai_failure_rate_percent)}
              sub={t("agent.analytics.stat.aiFailureRateSub")}
            />
            <StatCard title={t("agent.analytics.stat.kbHits")} value={totals.kb_hits} />
            <StatCard
              title={t("agent.analytics.stat.kbHitRate")}
              value={formatPercent(totals.kb_hit_rate_percent)}
              sub={t("agent.analytics.stat.kbHitRateSub")}
            />
            <StatCard
              title={t("agent.analytics.stat.maxAiRounds")}
              value={totals.max_ai_rounds}
              sub={t("agent.analytics.stat.maxAiRoundsSub")}
            />
            <StatCard
              title={t("agent.analytics.stat.sessionsWithAi")}
              value={totals.sessions_with_ai}
              sub={tr("agent.analytics.stat.sessionsWithAiSub", {
                pct: formatPercent(totals.ai_participation_rate_percent),
              })}
            />
            <StatCard
              title={t("agent.analytics.stat.aiToHuman")}
              value={totals.ai_to_human_sessions}
              sub={tr("agent.analytics.stat.aiToHumanSub", {
                pct: formatPercent(totals.ai_to_human_rate_percent),
              })}
            />
            <StatCard
              title={t("agent.analytics.stat.humanToAi")}
              value={totals.human_to_ai_sessions}
              sub={tr("agent.analytics.stat.humanToAiSub", {
                pct: formatPercent(totals.human_to_ai_rate_percent),
              })}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 rounded-xl border border-border/60 bg-card p-3 sm:p-4 md:gap-8 lg:grid-cols-2">
            <DailyBars
              daily={data!.daily}
              field="widget_opens"
              label={t("agent.analytics.chart.widgetOpens")}
              color="rgb(34 197 94)"
              emptyLabel={t("agent.analytics.empty")}
            />
            <DailyBars
              daily={data!.daily}
              field="sessions"
              label={t("agent.analytics.chart.sessions")}
              color="rgb(59 130 246)"
              emptyLabel={t("agent.analytics.empty")}
            />
            <DailyBars
              daily={data!.daily}
              field="messages"
              label={t("agent.analytics.chart.messages")}
              color="rgb(168 85 247)"
              emptyLabel={t("agent.analytics.empty")}
            />
            <DailyBars
              daily={data!.daily}
              field="ai_replies"
              label={t("agent.analytics.chart.aiReplies")}
              color="rgb(249 115 22)"
              emptyLabel={t("agent.analytics.empty")}
            />
          </div>
        </>
      )}

      {!loading && !totals && (
        <p className="text-sm text-muted-foreground">{t("agent.analytics.emptyOrFailed")}</p>
      )}
    </div>
  );
}
