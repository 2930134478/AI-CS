import { API_BASE_URL } from "@/lib/config";

// AI 配置类型定义
export interface AIConfig {
  id: number;
  user_id: number;
  provider: string;
  api_url: string;
  model: string;
  model_type: string;
  is_active: boolean;
  is_public: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

// 创建 AI 配置请求
export interface CreateAIConfigRequest {
  provider: string;
  api_url: string;
  api_key: string;
  model: string;
  model_type?: string;
  is_active?: boolean;
  is_public?: boolean;
  description?: string;
}

// 更新 AI 配置请求
export interface UpdateAIConfigRequest {
  provider?: string;
  api_url?: string;
  api_key?: string;
  model?: string;
  model_type?: string;
  is_active?: boolean;
  is_public?: boolean;
  description?: string;
}

// 获取用户的所有 AI 配置
export async function fetchAIConfigs(userId: number): Promise<AIConfig[]> {
  const res = await fetch(`${API_BASE_URL}/agent/ai-config/${userId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("获取 AI 配置失败");
  }
  return res.json();
}

// 获取单个 AI 配置
export async function fetchAIConfig(
  userId: number,
  configId: number
): Promise<AIConfig> {
  const res = await fetch(`${API_BASE_URL}/agent/ai-config/${userId}/${configId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("获取 AI 配置失败");
  }
  return res.json();
}

// 创建 AI 配置
export async function createAIConfig(
  userId: number,
  data: CreateAIConfigRequest
): Promise<AIConfig> {
  const res = await fetch(`${API_BASE_URL}/agent/ai-config/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "创建 AI 配置失败");
  }
  return res.json();
}

// 更新 AI 配置
export async function updateAIConfig(
  userId: number,
  configId: number,
  data: UpdateAIConfigRequest
): Promise<AIConfig> {
  const res = await fetch(`${API_BASE_URL}/agent/ai-config/${userId}/${configId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "更新 AI 配置失败");
  }
  return res.json();
}

// 删除 AI 配置
export async function deleteAIConfig(
  userId: number,
  configId: number
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/agent/ai-config/${userId}/${configId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("删除 AI 配置失败");
  }
}

// 获取开放的模型列表（供访客选择）
export async function fetchPublicAIModels(
  modelType: string = "text"
): Promise<AIConfig[]> {
  const res = await fetch(
    `${API_BASE_URL}/conversations/ai-models?model_type=${modelType}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error("获取模型列表失败");
  }
  const data = await res.json();
  return data.models || [];
}

