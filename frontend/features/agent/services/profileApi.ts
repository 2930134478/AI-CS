// 客服个人资料 API 服务
import { API_BASE_URL } from "@/lib/config";
import { Profile } from "../types";

// 获取个人资料
export async function fetchProfile(userId: number): Promise<Profile | null> {
  const res = await fetch(`${API_BASE_URL}/agent/profile/${userId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.error || error.message || `获取个人资料失败 (${res.status})`
    );
  }
  const data = await res.json();
  return {
    id: data.id ?? 0,
    username: data.username ?? "",
    role: data.role ?? "",
    avatar_url: data.avatar_url ?? "",
    nickname: data.nickname ?? "",
    email: data.email ?? "",
    receive_ai_conversations: data.receive_ai_conversations ?? true, // 默认接收
  };
}

// 更新个人资料
export interface UpdateProfilePayload {
  nickname?: string;
  email?: string;
  receive_ai_conversations?: boolean; // 是否接收 AI 对话
}

export async function updateProfile(
  userId: number,
  payload: UpdateProfilePayload
): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/agent/profile/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.error || error.message || `更新个人资料失败 (${res.status})`
    );
  }
  const data = await res.json();
  return {
    id: data.id ?? 0,
    username: data.username ?? "",
    role: data.role ?? "",
    avatar_url: data.avatar_url ?? "",
    nickname: data.nickname ?? "",
    email: data.email ?? "",
    receive_ai_conversations: data.receive_ai_conversations ?? true, // 默认接收
  };
}

// 上传头像
export async function uploadAvatar(
  userId: number,
  file: File
): Promise<Profile> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_BASE_URL}/agent/avatar/${userId}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.error || error.message || `上传头像失败 (${res.status})`
    );
  }
  const data = await res.json();
  return {
    id: data.id ?? 0,
    username: data.username ?? "",
    role: data.role ?? "",
    avatar_url: data.avatar_url ?? "",
    nickname: data.nickname ?? "",
    email: data.email ?? "",
    receive_ai_conversations: data.receive_ai_conversations ?? true, // 默认接收
  };
}

