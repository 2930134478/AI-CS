// 统一的 API 配置
// 推荐生产形态（形态2）：同域反向代理，把后端挂到 /api 下。
// 这样无需在前端产物里写死域名/端口（避免 Docker 镜像里固化 localhost）。
export const API_BASE_URL = "";
export const API_PREFIX = "/api";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${p}`;
}

/** 知识库/文档/导入等接口需带当前用户 ID，供后端校验「是否开放知识库」开关 */
export function getAgentHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const id = window.localStorage.getItem("agent_user_id");
  if (!id) return {};
  return { "X-User-Id": id };
}

