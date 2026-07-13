import { apiUrl, getAgentHeaders } from "@/lib/config";

// 用户摘要信息（列表）
export interface UserSummary {
  id: number;
  username: string;
  role: "admin" | "agent";
  permissions?: string[];
  nickname: string;
  email: string;
  avatar_url: string;
  receive_ai_conversations: boolean;
  created_at: string;
  updated_at: string;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  password: string;
  role: "admin" | "agent";
  permissions?: string[];
  nickname?: string;
  email?: string;
}

// 更新用户请求
export interface UpdateUserRequest {
  role?: "admin" | "agent";
  permissions?: string[];
  nickname?: string;
  email?: string;
  receive_ai_conversations?: boolean;
}

// 更新密码请求
export interface UpdatePasswordRequest {
  old_password?: string; // 可选，管理员修改其他用户密码时不需要
  new_password: string;
}

// 获取所有用户列表
export async function fetchUsers(): Promise<UserSummary[]> {
  const res = await fetch(apiUrl("/admin/users"), {
    cache: "no-store",
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("权限不足，只有管理员才能查看用户列表");
    }
    if (res.status === 401) {
      throw new Error("未授权访问，请重新登录");
    }
    throw new Error("获取用户列表失败");
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
}

// 获取用户详情
export async function fetchUser(id: number): Promise<UserSummary> {
  const res = await fetch(apiUrl(`/admin/users/${id}`), {
    cache: "no-store",
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("权限不足，只有管理员才能查看用户详情");
    }
    if (res.status === 404) {
      throw new Error("用户不存在");
    }
    throw new Error("获取用户详情失败");
  }
  const data = await res.json();
  return data;
}

// 创建新用户
export async function createUser(data: CreateUserRequest): Promise<UserSummary> {
  const res = await fetch(apiUrl("/admin/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new Error("权限不足，只有管理员才能创建用户");
    }
    throw new Error(error.error || "创建用户失败");
  }
  const result = await res.json();
  return result.user;
}

// 更新用户信息
export async function updateUser(
  id: number,
  data: UpdateUserRequest
): Promise<UserSummary> {
  const res = await fetch(apiUrl(`/admin/users/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new Error("权限不足，只有管理员才能更新用户信息");
    }
    if (res.status === 404) {
      throw new Error("用户不存在");
    }
    throw new Error(error.error || "更新用户失败");
  }
  const result = await res.json();
  return result.user;
}

// 删除用户
export async function deleteUser(
  id: number
): Promise<{ transferredAIConfigs: number }> {
  const res = await fetch(apiUrl(`/admin/users/${id}`), {
    method: "DELETE",
    headers: getAgentHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new Error("权限不足，只有管理员才能删除用户");
    }
    if (res.status === 404) {
      throw new Error("用户不存在");
    }
    throw new Error(error.error || "删除用户失败");
  }
  const data = await res.json().catch(() => ({}));
  return {
    transferredAIConfigs:
      typeof data.transferred_ai_configs === "number"
        ? data.transferred_ai_configs
        : 0,
  };
}

// 更新用户密码
export async function updateUserPassword(
  id: number,
  data: UpdatePasswordRequest
): Promise<void> {
  const res = await fetch(apiUrl(`/admin/users/${id}/password`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new Error("权限不足，只有管理员才能修改用户密码");
    }
    if (res.status === 404) {
      throw new Error("用户不存在");
    }
    throw new Error(error.error || "更新密码失败");
  }
}
