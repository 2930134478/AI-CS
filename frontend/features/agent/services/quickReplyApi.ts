import { API_BASE_URL } from "@/lib/config";

export interface QuickReplySummary {
  id: number;
  user_id: number | null;
  title: string;
  content: string;
  category: string;
  sort_order: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateQuickReplyRequest {
  user_id?: number | null;
  title?: string;
  content: string;
  category?: string;
  sort_order?: number;
}

export interface UpdateQuickReplyRequest {
  title?: string;
  content?: string;
  category?: string;
  sort_order?: number;
  user_id?: number;
}

/**
 * 获取快捷回复模板列表
 */
export async function fetchQuickReplies(
  userId: number,
  category?: string
): Promise<QuickReplySummary[]> {
  const params = new URLSearchParams();
  params.set("user_id", String(userId));
  if (category) {
    params.set("category", category);
  }

  const res = await fetch(`${API_BASE_URL}/quick-replies?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取快捷回复模板失败");
  }

  const data = await res.json();
  return data.quick_replies || [];
}

/**
 * 获取快捷回复模板详情
 */
export async function fetchQuickReply(id: number): Promise<QuickReplySummary> {
  const res = await fetch(`${API_BASE_URL}/quick-replies/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取快捷回复模板详情失败");
  }

  return res.json();
}

/**
 * 创建快捷回复模板
 */
export async function createQuickReply(
  request: CreateQuickReplyRequest
): Promise<QuickReplySummary> {
  const res = await fetch(`${API_BASE_URL}/quick-replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "创建快捷回复模板失败");
  }

  return res.json();
}

/**
 * 更新快捷回复模板
 */
export async function updateQuickReply(
  id: number,
  request: UpdateQuickReplyRequest
): Promise<QuickReplySummary> {
  const res = await fetch(`${API_BASE_URL}/quick-replies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "更新快捷回复模板失败");
  }

  return res.json();
}

/**
 * 删除快捷回复模板
 */
export async function deleteQuickReply(id: number, userId?: number): Promise<void> {
  const params = new URLSearchParams();
  if (userId) {
    params.set("user_id", String(userId));
  }

  const res = await fetch(`${API_BASE_URL}/quick-replies/${id}?${params.toString()}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "删除快捷回复模板失败");
  }
}

/**
 * 记录快捷回复使用
 */
export async function recordQuickReplyUsage(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/quick-replies/${id}/use`, {
    method: "POST",
  });

  if (!res.ok) {
    // 不抛出错误，静默失败
    console.error("记录使用次数失败");
  }
}

/**
 * 获取分类列表
 */
export async function fetchQuickReplyCategories(userId: number): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/quick-replies/categories?user_id=${userId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取分类列表失败");
  }

  const data = await res.json();
  return data.categories || [];
}
