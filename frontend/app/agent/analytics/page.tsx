"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAnalyticsSummary,
  type AnalyticsDailyRow,
  type AnalyticsSummaryResponse,
} from "@/features/agent/services/analyticsApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";

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
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
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
}: {
  daily: AnalyticsDailyRow[];
  field: keyof Pick<
    AnalyticsDailyRow,
    "widget_opens" | "sessions" | "messages" | "ai_replies"
  >;
  label: string;
  color: string;
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
    return <p className="text-sm text-muted-foreground">暂无数据</p>;
  }

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
      <div className="flex h-36 items-end gap-1 border-b border-border/40 pb-1">
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
  );
}

export default function AnalyticsPage(_props: { embedded?: boolean }) {
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

  const t = data?.totals;

  return (
    <div
      className="flex flex-col min-h-0 overflow-auto p-4 max-w-6xl mx-auto w-full"
    >
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">数据报表</h1>
          <p className="text-sm text-muted-foreground mt-1">
            访客小窗与 AI 客服统计（按上海时区自然日，不含「知识库测试」内部会话）
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            从
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            到
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </label>
          <Button size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? "加载中…" : "查询"}
          </Button>
        </div>
      </div>

      {data && (
        <p className="text-xs text-muted-foreground mb-4">{data.note}</p>
      )}

      {t && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            <StatCard title="小窗打开次数" value={t.widget_opens} sub="需前端埋点，历史数据可能为 0" />
            <StatCard title="新建会话数" value={t.sessions} />
            <StatCard title="消息数" value={t.messages} />
            <StatCard title="AI 回复次数" value={t.ai_replies} />
            <StatCard title="AI 失败次数" value={t.ai_failed} />
            <StatCard title="AI 失败率" value={formatPercent(t.ai_failure_rate_percent)} sub="占 AI 回复条数" />
            <StatCard title="知识库命中次数" value={t.kb_hits} />
            <StatCard title="知识库命中率" value={formatPercent(t.kb_hit_rate_percent)} sub="占成功 AI 回复" />
            <StatCard title="最大 AI 对话轮数" value={t.max_ai_rounds} sub="单会话内用户+AI 一轮" />
            <StatCard title="AI 参与会话" value={t.sessions_with_ai} sub={`占新建会话 ${formatPercent(t.ai_participation_rate_percent)}`} />
            <StatCard title="AI→人工（会话数）" value={t.ai_to_human_sessions} sub={`占有过 AI 发言的会话 ${formatPercent(t.ai_to_human_rate_percent)}`} />
            <StatCard title="人工→AI（会话数）" value={t.human_to_ai_sessions} sub={`占有过人工发言的会话 ${formatPercent(t.human_to_ai_rate_percent)}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-xl border border-border/60 bg-card p-4">
            <DailyBars
              daily={data!.daily}
              field="widget_opens"
              label="每日小窗打开"
              color="rgb(34 197 94)"
            />
            <DailyBars
              daily={data!.daily}
              field="sessions"
              label="每日新建会话"
              color="rgb(59 130 246)"
            />
            <DailyBars
              daily={data!.daily}
              field="messages"
              label="每日消息数"
              color="rgb(168 85 247)"
            />
            <DailyBars
              daily={data!.daily}
              field="ai_replies"
              label="每日 AI 回复"
              color="rgb(249 115 22)"
            />
          </div>
        </>
      )}

      {!loading && !t && (
        <p className="text-sm text-muted-foreground">暂无数据或加载失败</p>
      )}
    </div>
  );
}
