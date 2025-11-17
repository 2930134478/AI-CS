import { API_BASE_URL } from "@/lib/config";
import { MessageItem } from "../types";

interface SendMessagePayload {
  conversationId: number;
  content: string;
  senderId?: number;
  senderIsAgent?: boolean;
}

export async function fetchMessages(
  conversationId: number
): Promise<MessageItem[]> {
  const res = await fetch(
    `${API_BASE_URL}/messages?conversation_id=${conversationId}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error("获取消息失败");
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
}

export async function sendMessage({
  conversationId,
  content,
  senderId,
  senderIsAgent = true,
}: SendMessagePayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      content,
      sender_is_agent: senderIsAgent,
      sender_id: typeof senderId === "number" ? senderId : 0,
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error(
      `❌ 发送消息失败: 对话ID=${conversationId}, 状态=${res.status}, 错误=${JSON.stringify(error)}`
    );
    throw new Error(error.error || "发送消息失败");
  }
}

export interface MarkMessagesReadResult {
  message_ids: number[];
  unread_count: number;
  read_at?: string;
}

export async function markMessagesRead(
  conversationId: number,
  readerIsAgent: boolean
): Promise<MarkMessagesReadResult | null> {
  const res = await fetch(`${API_BASE_URL}/messages/read`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      reader_is_agent: readerIsAgent,
    }),
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return {
    message_ids: Array.isArray(data.message_ids) ? data.message_ids : [],
    unread_count:
      typeof data.unread_count === "number" ? data.unread_count : 0,
    read_at: typeof data.read_at === "string" ? data.read_at : undefined,
  };
}

