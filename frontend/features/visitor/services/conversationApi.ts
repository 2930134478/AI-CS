import { apiUrl } from "@/lib/config";
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
  return {
    conversation_id: data.conversation_id ?? 0,
    status: data.status ?? "open",
  };
}

