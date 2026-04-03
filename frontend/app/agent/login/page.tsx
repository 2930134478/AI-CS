"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setAgentWSToken } from "@/utils/storage";
import { useI18n } from "@/lib/i18n/provider";

export default function AgentLoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // 客服登录
  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // 阻止默认行为

    if (!username || !password) {
      setError(t("agent.login.error.empty"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 登录成功，保存用户信息到 localStorage
        localStorage.setItem("agent_user_id", String(data.user_id));
        localStorage.setItem("agent_username", data.username);
        localStorage.setItem("agent_role", data.role);
        localStorage.setItem(
          "agent_permissions",
          JSON.stringify(Array.isArray(data.permissions) ? data.permissions : [])
        );
        if (typeof data.ws_token === "string" && typeof data.ws_token_exp === "number") {
          setAgentWSToken(data.ws_token, data.ws_token_exp);
        }

        // 跳转到客服工作台（三栏布局）
        router.push("/agent/dashboard");
      } else {
        // 登录失败，显示错误信息
        setError(data.error || data.message || t("agent.login.error.failed"));
      }
    } catch (error) {
      console.error("登录失败:", error);
      setError(t("agent.login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg border shadow-lg w-full sm:w-96">
        <h1 className="text-center text-2xl font-bold mb-2 text-gray-800">
          {t("agent.login.title")}
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          {t("agent.login.subtitle")}
        </p>

        <form onSubmit={handleLogin}>
          <Input
            type="text"
            placeholder={t("agent.login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4"
            disabled={loading}
          />
          <Input
            type="password"
            placeholder={t("agent.login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4"
            disabled={loading}
          />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="default"
            size="default"
            className="w-full"
          >
            {loading ? t("agent.login.submitting") : t("agent.login.submit")}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-400">
          <p>{t("agent.login.demoHint")}</p>
        </div>
      </div>
    </div>
  );
}

