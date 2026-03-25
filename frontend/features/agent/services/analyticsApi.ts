import { apiUrl, getAgentHeaders } from "@/lib/config";

export interface AnalyticsDailyRow {
  date: string;
  widget_opens: number;
  sessions: number;
  messages: number;
  ai_replies: number;
}

export interface AnalyticsTotals {
  widget_opens: number;
  sessions: number;
  messages: number;
  ai_replies: number;
  ai_failed: number;
  ai_failure_rate_percent: number;
  kb_hits: number;
  kb_hit_rate_percent: number;
  max_ai_rounds: number;
  sessions_with_ai: number;
  ai_participation_rate_percent: number;
  ai_to_human_sessions: number;
  ai_to_human_rate_percent: number;
  human_to_ai_sessions: number;
  human_to_ai_rate_percent: number;
  sessions_with_ai_user_msg: number;
  sessions_with_human_user_msg: number;
}

export interface AnalyticsSummaryResponse {
  from: string;
  to: string;
  totals: AnalyticsTotals;
  daily: AnalyticsDailyRow[];
  note: string;
}

export async function fetchAnalyticsSummary(
  from?: string,
  to?: string
): Promise<AnalyticsSummaryResponse> {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const qs = q.toString();
  const url = `${apiUrl("/agent/analytics/summary")}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: getAgentHeaders() });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error || `请求失败 ${res.status}`);
  }
  return res.json();
}
