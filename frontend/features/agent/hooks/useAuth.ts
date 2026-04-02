"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AgentUser } from "../../agent/types";
import { logout } from "../../agent/services/authApi";
import { clearAgentUser, getAgentUser, getAgentWSToken } from "@/utils/storage";

export function useAuth() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = getAgentUser();
    if (!current) {
      setLoading(false);
      router.push("/agent/login");
      return;
    }
    // 客服端实时链路依赖 ws_token；缺失/过期时强制重新登录，避免前端持续 401 重连且功能失效。
    if (!getAgentWSToken()) {
      clearAgentUser();
      setLoading(false);
      router.push("/agent/login");
      return;
    }
    setAgent(current);
    setLoading(false);
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      clearAgentUser();
      router.push("/");
    }
  }, [router]);

  return {
    agent,
    loading,
    isAuthenticated: Boolean(agent),
    logout: handleLogout,
  };
}

