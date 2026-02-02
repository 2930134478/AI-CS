import { API_BASE_URL } from "@/lib/config";

// 知识库向量配置（API 返回，不含明文 API Key）
export interface EmbeddingConfig {
  id?: number;
  embedding_type: string;
  api_url: string;
  api_key_masked?: string;
  model: string;
  customer_can_use_kb: boolean;
  updated_at?: string;
}

// 更新入参（api_key 可选，不传则保留原密钥）
export interface UpdateEmbeddingConfigRequest {
  embedding_type?: string;
  api_url?: string;
  api_key?: string;
  model?: string;
  customer_can_use_kb?: boolean;
}

/** 获取当前知识库向量配置（需传 user_id 以通过代理） */
export async function fetchEmbeddingConfig(userId: number): Promise<EmbeddingConfig> {
  const res = await fetch(`${API_BASE_URL}/agent/embedding-config?user_id=${userId}`, {
    cache: "no-store",
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
  const res = await fetch(`${API_BASE_URL}/agent/embedding-config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "更新知识库向量配置失败");
  }
  return res.json();
}
