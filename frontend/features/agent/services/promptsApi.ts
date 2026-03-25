import { apiUrl } from "@/lib/config";

export interface PromptItem {
  key: string;
  name: string;
  content: string;
  updated_at?: string;
}

export interface PromptsResponse {
  prompts: PromptItem[];
}

/** 获取所有提示词配置（用于「提示词」页） */
export async function fetchPrompts(userId: number): Promise<PromptItem[]> {
  const res = await fetch(`${apiUrl("/agent/prompts")}?user_id=${userId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("获取提示词配置失败");
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "提示词接口返回非 JSON，请确认：1) 后端已启动；2) 前端代理端口与后端一致（默认 8080，若后端在 18080 请在 frontend/.env.local 设置 NEXT_PUBLIC_BACKEND_PORT=18080 并重启前端）"
    );
  }
  const data: PromptsResponse = await res.json();
  return data.prompts ?? [];
}

/** 更新单条提示词（仅管理员） */
export async function updatePrompt(
  userId: number,
  key: string,
  content: string
): Promise<void> {
  const res = await fetch(apiUrl("/agent/prompts"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, key, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "更新提示词失败");
  }
}
