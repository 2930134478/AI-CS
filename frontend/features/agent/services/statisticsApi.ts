import { API_BASE_URL } from "@/lib/config";

export interface DashboardStats {
  today_conversations: number;
  today_messages: number;
  online_agents: number;
  active_visitors: number;
  total_conversations: number;
  total_messages: number;
}

export interface ConversationTrendData {
  date: string;
  count: number;
  message_count: number;
  visitor_count?: number;
}

export interface AgentWorkloadData {
  agent_id: number;
  agent_name: string;
  conversation_count: number;
  message_count: number;
  avg_response_time: number;
}

export interface VisitorSourceData {
  source: string;
  count: number;
}

export interface AIStatsData {
  total_ai_responses: number;
  ai_response_rate: number;
  avg_response_time: number;
  human_takeover_rate: number;
}

/**
 * 获取 Dashboard 概览统计数据
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/statistics/dashboard`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取统计数据失败");
  }

  return res.json();
}

/**
 * 获取对话趋势数据
 */
export async function fetchConversationTrend(
  days: number = 7
): Promise<{ trend: ConversationTrendData[]; days: number }> {
  const res = await fetch(`${API_BASE_URL}/statistics/conversations/trend?days=${days}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取对话趋势数据失败");
  }

  return res.json();
}

/**
 * 获取客服工作量统计
 */
export async function fetchAgentWorkload(
  days: number = 7
): Promise<{ workload: AgentWorkloadData[]; days: number }> {
  const res = await fetch(`${API_BASE_URL}/statistics/agents/workload?days=${days}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取客服工作量数据失败");
  }

  return res.json();
}

/**
 * 获取访客分析数据
 */
export async function fetchVisitorAnalytics(days: number = 7): Promise<{
  sources: VisitorSourceData[];
  browsers: { browser: string; count: number }[];
  hourly_dist: { hour: number; count: number }[];
}> {
  const res = await fetch(`${API_BASE_URL}/statistics/visitors?days=${days}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取访客分析数据失败");
  }

  return res.json();
}

/**
 * 获取AI统计数据
 */
export async function fetchAIStats(days: number = 7): Promise<AIStatsData> {
  const res = await fetch(`${API_BASE_URL}/statistics/ai?days=${days}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取AI统计数据失败");
  }

  return res.json();
}
