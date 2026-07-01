import { apiUrl } from "@/lib/config";
import {
  getVisitorConversationHeaders,
  saveVisitorAccessToken,
} from "@/lib/visitor-session";
import { reportFrontendLog } from "@/features/agent/services/systemLogApi";

export interface InitVisitorConversationPayload {
  visitorId: number;
  website?: string;
  referrer?: string;
  browser?: string;
  os?: string;
  language?: string;
  ipAddress?: string;
  chatMode?: string; // 对话模式：human（人工客服）、ai（AI客服）
  aiConfigId?: number; // AI 配置 ID（访客选择的模型配置，AI 模式时必需）
}

export interface InitVisitorConversationResult {
  conversation_id: number;
  status: string;
  access_token: string;
}

export async function initVisitorConversation(
  payload: InitVisitorConversationPayload
): Promise<InitVisitorConversationResult> {
  const res = await fetch(apiUrl("/conversation/init"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitor_id: payload.visitorId,
      website: payload.website,
      referrer: payload.referrer,
      browser: payload.browser,
      os: payload.os,
      language: payload.language,
      ip_address: payload.ipAddress,
      chat_mode: payload.chatMode,
      ai_config_id: payload.aiConfigId,
    }),
  });

  if (!res.ok) {
    void reportFrontendLog({
      level: "warn",
      category: "frontend",
      event: "visitor_init_conversation_failed",
      message: "访客初始化对话失败",
      visitorId: payload.visitorId,
      meta: { status: res.status, chatMode: payload.chatMode, aiConfigId: payload.aiConfigId },
    });
    throw new Error("初始化对话失败");
  }

  const data = await res.json();
  const conversationId = data.conversation_id ?? 0;
  const accessToken = typeof data.access_token === "string" ? data.access_token : "";
  if (conversationId && accessToken) {
    saveVisitorAccessToken(conversationId, accessToken);
  }
  return {
    conversation_id: conversationId,
    status: data.status ?? "open",
    access_token: accessToken,
  };
}

/** 访客更新本会话的联系邮箱（可选，用于离线收消息） */
export async function updateVisitorContactEmail(
  conversationId: number,
  email: string,
  accessToken?: string | null
): Promise<{ email: string }> {
  const res = await fetch(apiUrl(`/conversations/${conversationId}/contact`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getVisitorConversationHeaders(conversationId, accessToken),
    },
    body: JSON.stringify({ email: email.trim() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "保存邮箱失败");
  }

  const data = await res.json();
  return { email: data.email ?? email.trim() };
}

