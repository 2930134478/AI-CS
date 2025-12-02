import { API_BASE_URL } from "@/lib/config";
import { MessageItem } from "../types";

interface SendMessagePayload {
  conversationId: number;
  content: string;
  senderId?: number;
  senderIsAgent?: boolean;
  // 文件相关字段（可选）
  fileUrl?: string;
  fileType?: "image" | "document";
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

// 文件上传结果
export interface UploadFileResult {
  file_url: string;
  file_type: "image" | "document";
  file_name: string;
  file_size: number;
  mime_type: string;
}

export async function fetchMessages(
  conversationId: number,
  includeAIMessages: boolean = false
): Promise<MessageItem[]> {
  const res = await fetch(
    `${API_BASE_URL}/messages?conversation_id=${conversationId}&include_ai_messages=${includeAIMessages}`,
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

// 上传文件
export async function uploadFile(
  file: File,
  conversationId?: number
): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (conversationId) {
    formData.append("conversation_id", conversationId.toString());
  }

  const res = await fetch(`${API_BASE_URL}/messages/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "文件上传失败");
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "文件上传失败");
  }

  return data.data;
}

export async function sendMessage({
  conversationId,
  content,
  senderId,
  senderIsAgent = true,
  fileUrl,
  fileType,
  fileName,
  fileSize,
  mimeType,
}: SendMessagePayload): Promise<void> {
  const payload: any = {
    conversation_id: conversationId,
    content,
    sender_is_agent: senderIsAgent,
    sender_id: typeof senderId === "number" ? senderId : 0,
  };

  // 如果有文件，添加文件字段
  if (fileUrl) {
    payload.file_url = fileUrl;
    if (fileType) payload.file_type = fileType;
    if (fileName) payload.file_name = fileName;
    if (fileSize) payload.file_size = fileSize;
    if (mimeType) payload.mime_type = mimeType;
  }

  const res = await fetch(`${API_BASE_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

