import { apiUrl, getAgentHeaders } from "@/lib/config";
import { getVisitorConversationHeaders } from "@/lib/visitor-session";
import { MessageItem } from "../types";
import { reportFrontendLog } from "./systemLogApi";

/** 解析 POST /messages 返回的消息体（与 models.Message JSON 一致） */
function messageItemFromResponse(data: unknown): MessageItem | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = data as Record<string, unknown>;
  if (typeof raw.id !== "number" || typeof raw.conversation_id !== "number") {
    return null;
  }
  return {
    id: raw.id,
    conversation_id: raw.conversation_id,
    sender_id: typeof raw.sender_id === "number" ? raw.sender_id : 0,
    sender_is_agent: Boolean(raw.sender_is_agent),
    content: typeof raw.content === "string" ? raw.content : "",
    created_at:
      typeof raw.created_at === "string"
        ? raw.created_at
        : new Date().toISOString(),
    message_type:
      typeof raw.message_type === "string" ? raw.message_type : undefined,
    chat_mode: typeof raw.chat_mode === "string" ? raw.chat_mode : undefined,
    is_read: Boolean(raw.is_read),
    read_at:
      raw.read_at === null || raw.read_at === undefined
        ? null
        : String(raw.read_at),
    file_url:
      raw.file_url === null || raw.file_url === undefined
        ? null
        : String(raw.file_url),
    file_type:
      typeof raw.file_type === "string" ? raw.file_type : undefined,
    file_name:
      typeof raw.file_name === "string" ? raw.file_name : undefined,
    file_size:
      typeof raw.file_size === "number" ? raw.file_size : undefined,
    mime_type:
      typeof raw.mime_type === "string" ? raw.mime_type : undefined,
    sources_used:
      typeof raw.sources_used === "string" ? raw.sources_used : undefined,
  };
}

interface SendMessagePayload {
  conversationId: number;
  content: string;
  senderId?: number;
  senderIsAgent?: boolean;
  accessToken?: string;
  fileUrl?: string;
  fileType?: "image" | "document";
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  useKnowledgeBase?: boolean;
  useLLM?: boolean;
  useWebSearch?: boolean;
  needWebSearch?: boolean;
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
  includeAIMessages: boolean = false,
  accessToken?: string
): Promise<MessageItem[]> {
  const res = await fetch(
    `${apiUrl("/messages")}?conversation_id=${conversationId}&include_ai_messages=${includeAIMessages}`,
    {
      cache: "no-store",
      headers: {
        ...getAgentHeaders(),
        ...getVisitorConversationHeaders(conversationId, accessToken),
      },
    }
  );
  if (!res.ok) {
    void reportFrontendLog({
      level: "warn",
      category: "frontend",
      event: "fetch_messages_failed",
      message: "获取消息失败",
      conversationId,
      meta: { status: res.status, includeAIMessages },
    });
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
  conversationId?: number,
  accessToken?: string
): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (conversationId) {
    formData.append("conversation_id", conversationId.toString());
  }

  const res = await fetch(apiUrl("/messages/upload"), {
    method: "POST",
    headers:
      conversationId != null
        ? getVisitorConversationHeaders(conversationId, accessToken)
        : getAgentHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    void reportFrontendLog({
      level: "warn",
      category: "frontend",
      event: "upload_file_failed",
      message: "上传文件失败",
      conversationId,
      meta: { status: res.status, error },
    });
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
  accessToken,
  fileUrl,
  fileType,
  fileName,
  fileSize,
  mimeType,
  useKnowledgeBase,
  useLLM,
  useWebSearch,
  needWebSearch,
}: SendMessagePayload): Promise<MessageItem | null> {
  const payload: Record<string, unknown> = {
    conversation_id: conversationId,
    content,
    sender_is_agent: senderIsAgent,
    sender_id: typeof senderId === "number" ? senderId : 0,
  };

  if (fileUrl) {
    payload.file_url = fileUrl;
    if (fileType) payload.file_type = fileType;
    if (fileName) payload.file_name = fileName;
    if (fileSize) payload.file_size = fileSize;
    if (mimeType) payload.mime_type = mimeType;
  }
  if (useKnowledgeBase !== undefined) payload.use_knowledge_base = useKnowledgeBase;
  if (useLLM !== undefined) payload.use_llm = useLLM;
  if (useWebSearch !== undefined) payload.use_web_search = useWebSearch;
  if (needWebSearch !== undefined) payload.need_web_search = needWebSearch;

  const res = await fetch(apiUrl("/messages"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAgentHeaders(),
      ...(senderIsAgent
        ? {}
        : getVisitorConversationHeaders(conversationId, accessToken)),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error(
      `❌ 发送消息失败: 对话ID=${conversationId}, 状态=${res.status}, 错误=${JSON.stringify(error)}`
    );
    void reportFrontendLog({
      level: "error",
      category: "frontend",
      event: "send_message_failed",
      message: "发送消息失败",
      conversationId,
      meta: { status: res.status, error },
    });
    throw new Error(error.error || "发送消息失败");
  }

  try {
    const data: unknown = await res.json();
    return messageItemFromResponse(data);
  } catch {
    return null;
  }
}

export interface MarkMessagesReadResult {
  message_ids: number[];
  unread_count: number;
  read_at?: string;
}

export async function markMessagesRead(
  conversationId: number,
  readerIsAgent: boolean,
  accessToken?: string
): Promise<MarkMessagesReadResult | null> {
  const res = await fetch(apiUrl("/messages/read"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAgentHeaders(),
      ...(readerIsAgent
        ? {}
        : getVisitorConversationHeaders(conversationId, accessToken)),
    },
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

