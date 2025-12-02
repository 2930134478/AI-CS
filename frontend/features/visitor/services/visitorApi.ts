/**
 * 访客端 API 服务
 * 提供访客相关的 API 调用
 */

import { API_BASE_URL } from "@/lib/config";

/**
 * 在线客服信息
 */
export interface OnlineAgent {
  id: number;
  nickname: string;
  avatar_url: string;
}

/**
 * 获取在线客服列表
 */
export async function fetchOnlineAgents(): Promise<OnlineAgent[]> {
  const response = await fetch(`${API_BASE_URL}/visitor/online-agents`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`获取在线客服列表失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data.agents || [];
}

