"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AgentLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // 客服登录
  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // 阻止默认行为

    if (!username || !password) {
      setError("用户名和密码不能为空");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
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

        // 跳转到客服工作台（三栏布局）
        router.push("/agent/dashboard");
      } else {
        // 登录失败，显示错误信息
        setError(data.error || data.message || "登录失败");
      }
    } catch (error) {
      console.error("登录失败:", error);
      setError("登录失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg border shadow-lg w-full sm:w-96">
        <h1 className="text-center text-2xl font-bold mb-2 text-gray-800">
          客服登录
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          管理员和客服请在此登录
        </p>

        <form onSubmit={handleLogin}>
          <Input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4"
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="密码"
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
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-400">
          <p>默认管理员账号：admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

