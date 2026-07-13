// 统一的 API 配置
// 推荐生产形态（形态2）：同域反向代理，把后端挂到 /api 下。
// 这样无需在前端产物里写死域名/端口（避免 Docker 镜像里固化 localhost）。
export const API_BASE_URL = "";
export const API_PREFIX = "/api";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${p}`;
}

import { getAgentWSToken } from "@/utils/storage";

/** 客服 API 请求头：携带 login 返回的 ws_token（Bearer），不可伪造用户身份 */
export function getAgentHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = getAgentWSToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

