import { apiUrl, getAgentHeaders } from "@/lib/config";

export interface SystemLogItem {
  id: number;
  timestamp: string;
  level: string;
  category: string;
  event: string;
  source: string;
  trace_id?: string;
  conversation_id?: number;
  user_id?: number;
  visitor_id?: number;
  message: string;
  meta_json?: string;
  created_at: string;
}

export interface QuerySystemLogsResult {
  items: SystemLogItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface QuerySystemLogsParams {
  from?: string;
  to?: string;
  level?: string;
  category?: string;
  event?: string;
  source?: string;
  conversationId?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface LogMinLevelPolicy {
  effective_min_level: string;
  env_min_level: string;
  persisted_in_database: boolean;
}

export async function fetchLogMinLevelPolicy(): Promise<LogMinLevelPolicy> {
  const res = await fetch(apiUrl("/agent/logs/min-level"), {
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error || `加载策略失败(${res.status})`);
  }
  return res.json();
}

export async function putLogMinLevelPolicy(minLevel: string): Promise<{ effective_min_level: string }> {
  const res = await fetch(apiUrl("/agent/logs/min-level"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAgentHeaders(),
    },
    body: JSON.stringify({ min_level: minLevel }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error || `保存失败(${res.status})`);
  }
  return res.json();
}

export async function deleteLogMinLevelPolicy(): Promise<{ effective_min_level: string }> {
  const res = await fetch(apiUrl("/agent/logs/min-level"), {
    method: "DELETE",
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error || `恢复失败(${res.status})`);
  }
  return res.json();
}

export async function fetchSystemLogs(params: QuerySystemLogsParams): Promise<QuerySystemLogsResult> {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.level) q.set("level", params.level);
  if (params.category) q.set("category", params.category);
  if (params.event) q.set("event", params.event);
  if (params.source) q.set("source", params.source);
  if (params.conversationId != null) q.set("conversation_id", String(params.conversationId));
  if (params.keyword) q.set("keyword", params.keyword);
  q.set("page", String(params.page ?? 1));
  q.set("page_size", String(params.pageSize ?? 50));

  const res = await fetch(`${apiUrl("/agent/logs/api")}?${q.toString()}`, {
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error || `加载日志失败(${res.status})`);
  }
  return res.json();
}

export async function reportFrontendLog(input: {
  level: "info" | "warn" | "error";
  category: string;
  event: string;
  message: string;
  traceId?: string;
  conversationId?: number;
  visitorId?: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    level: input.level,
    category: input.category,
    event: input.event,
    message: input.message,
    trace_id: input.traceId,
    conversation_id: input.conversationId,
    visitor_id: input.visitorId,
    meta: input.meta ?? {},
  };
  const res = await fetch(apiUrl("/agent/logs/frontend"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAgentHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // 日志上报失败不阻断业务
    console.warn("frontend log report failed", res.status);
  }
}

