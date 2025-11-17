// 头像工具函数
import { API_BASE_URL } from "@/lib/config";

/**
 * 获取完整的头像 URL
 * 如果 avatarUrl 已经是完整 URL（以 http:// 或 https:// 开头），直接返回
 * 否则拼接 API_BASE_URL
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) {
    return null;
  }
  // 如果已经是完整 URL，直接返回
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }
  // 如果是相对路径，拼接 API_BASE_URL
  // 确保路径以 / 开头
  const path = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return `${API_BASE_URL}${path}`;
}

/**
 * 根据用户信息生成头像颜色
 */
export function getAvatarColor(seed: string | number): string {
  const value = typeof seed === "string" ? seed.length : seed;
  return `hsl(${(value * 137.5) % 360}, 70%, 50%)`;
}

/**
 * 获取头像显示文本（首字母或用户名）
 */
export function getAvatarInitial(username: string, nickname?: string): string {
  const displayName = nickname || username || "?";
  return displayName.charAt(0).toUpperCase();
}

