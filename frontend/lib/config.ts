// 统一的 API 配置
// 使用相对路径，自动适配当前域名（无论是否绑定域名都能工作）
// 前端和后端通过 Nginx 代理在同一域名下，所以使用相对路径即可
export const API_BASE_URL = "";

/** 知识库/文档/导入等接口需带当前用户 ID，供后端校验「是否开放知识库」开关 */
export function getAgentHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const id = window.localStorage.getItem("agent_user_id");
  if (!id) return {};
  return { "X-User-Id": id };
}

