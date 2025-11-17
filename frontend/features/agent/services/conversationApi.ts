import { API_BASE_URL } from "@/lib/config";
import {
  ConversationDetail,
  ConversationSummary,
} from "../types";

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    cache: "no-store",
  });
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
  }));
}

export async function searchConversations(
  query: string
): Promise<ConversationSummary[]> {
  const res = await fetch(
    `${API_BASE_URL}/conversations/search?q=${encodeURIComponent(query)}`,
    {
      cache: "no-store",
    }
  );
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
  }));
}

export async function fetchConversationDetail(
  conversationId: number
): Promise<ConversationDetail | null> {
  const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return {
    ...data,
    unread_count: data.unread_count ?? 0,
  };
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
    `${API_BASE_URL}/conversations/${conversationId}/contact`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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

