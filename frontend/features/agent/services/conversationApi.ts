import { apiUrl, getAgentHeaders } from "@/lib/config";
import {
  ConversationDetail,
  ConversationSummary,
} from "../types";

export type ConversationListType = "visitor" | "internal";
export type ConversationStatus = "open" | "closed";

export async function fetchConversations(
  userId?: number,
  opts?: { type?: ConversationListType; status?: ConversationStatus }
): Promise<ConversationSummary[]> {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", String(userId));
  if (opts?.type) params.set("type", opts.type);
  if (opts?.status) params.set("status", opts.status);
  const url = `${apiUrl("/conversations")}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store", headers: getAgentHeaders() });
  if (!res.ok) {
    throw new Error("获取对话列表失败");
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item) => ({
    ...item,
    unread_count: item.unread_count ?? 0,
    has_participated: item.has_participated ?? false,
  }));
}

/** 创建一条内部对话（知识库测试），返回新对话 ID */
export async function initInternalConversation(userId: number): Promise<{ conversation_id: number }> {
  const res = await fetch(`${apiUrl("/conversations/internal")}?user_id=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "创建内部对话失败");
  }
  const data = await res.json();
  return { conversation_id: data.conversation_id };
}

export async function searchConversations(
  query: string,
  userId?: number,
  opts?: { status?: ConversationStatus }
): Promise<ConversationSummary[]> {
  const status = opts?.status ?? "open";
  const url = userId
    ? `${apiUrl("/conversations/search")}?q=${encodeURIComponent(query)}&user_id=${userId}&status=${status}`
    : `${apiUrl("/conversations/search")}?q=${encodeURIComponent(query)}&status=${status}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    throw new Error("搜索对话失败");
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item) => ({
    ...item,
    unread_count: item.unread_count ?? 0,
    has_participated: item.has_participated ?? false,
  }));
}

export async function fetchConversationDetail(
  conversationId: number,
  userId?: number
): Promise<ConversationDetail | null> {
  const url = userId
    ? `${apiUrl(`/conversations/${conversationId}`)}?user_id=${userId}`
    : apiUrl(`/conversations/${conversationId}`);
  const res = await fetch(url, { cache: "no-store", headers: getAgentHeaders() });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return {
    ...data,
    unread_count: data.unread_count ?? 0,
  };
}

/** 关闭会话（进入历史/归档）。访客再次发消息会自动 reopen（B 方案）。 */
export async function closeConversation(conversationId: number): Promise<void> {
  const res = await fetch(apiUrl(`/conversations/${conversationId}/close`), {
    method: "POST",
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error || `关闭会话失败(${res.status})`);
  }
}

export interface UpdateConversationContactPayload {
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateConversationContactResult {
  email: string;
  phone: string;
  notes: string;
}

export async function updateConversationContact(
  conversationId: number,
  payload: UpdateConversationContactPayload
): Promise<UpdateConversationContactResult> {
  const res = await fetch(
    apiUrl(`/conversations/${conversationId}/contact`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAgentHeaders() },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error("更新访客联系信息失败");
  }

  const data = await res.json();
  return {
    email: data.email ?? "",
    phone: data.phone ?? "",
    notes: data.notes ?? "",
  };
}

