import { apiUrl, getAgentHeaders } from "@/lib/config";

// 知识库向量配置（API 返回，不含明文 API Key）
export interface EmbeddingConfig {
  id?: number;
  embedding_type: string;
  api_url: string;
  api_key_masked?: string;
  model: string;
  customer_can_use_kb: boolean;
  visitor_web_search_enabled?: boolean;
  /** 联网方式：vendor=厂商内置 web_search，custom=自建 Serper */
  web_search_source?: "vendor" | "custom";
  updated_at?: string;
}

// 访客小窗配置（联网设置，供访客端拉取）
export interface VisitorWidgetConfig {
  web_search_enabled: boolean;
}

// 更新入参（api_key 可选，不传则保留原密钥）
export interface UpdateEmbeddingConfigRequest {
  embedding_type?: string;
  api_url?: string;
  api_key?: string;
  model?: string;
  customer_can_use_kb?: boolean;
  visitor_web_search_enabled?: boolean;
  /** 联网方式：vendor=厂商内置，custom=自建(Serper) */
  web_search_source?: "vendor" | "custom";
}

/** 获取当前知识库向量配置（需传 user_id 以通过代理） */
export async function fetchEmbeddingConfig(userId: number): Promise<EmbeddingConfig> {
  const res = await fetch(`${apiUrl("/agent/embedding-config")}?user_id=${userId}`, {
    cache: "no-store",
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    throw new Error("获取知识库向量配置失败");
  }
  return res.json();
}

/** 更新知识库向量配置（仅管理员）；修改后需重启后端生效 */
export async function updateEmbeddingConfig(
  userId: number,
  data: UpdateEmbeddingConfigRequest
): Promise<EmbeddingConfig> {
  const res = await fetch(apiUrl("/agent/embedding-config"), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify({ user_id: userId, ...data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "更新知识库向量配置失败");
  }
  return res.json();
}

/** 获取访客小窗配置（联网设置等，无需登录，供访客端调用） */
export async function fetchVisitorWidgetConfig(): Promise<VisitorWidgetConfig> {
  const res = await fetch(apiUrl("/visitor/widget-config"), { cache: "no-store" });
  if (!res.ok) throw new Error("获取小窗配置失败");
  return res.json();
}
