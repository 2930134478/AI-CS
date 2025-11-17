"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AgentUser } from "../../agent/types";
import { logout } from "../../agent/services/authApi";
import { clearAgentUser, getAgentUser } from "@/utils/storage";

export function useAuth() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = getAgentUser();
    if (!current) {
      setLoading(false);
      router.push("/");
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

