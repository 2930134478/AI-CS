"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-96">
        <h1 className="text-center text-2xl font-bold mb-2 text-gray-800">
          客服登录
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          管理员和客服请在此登录
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-400">
          <p>默认管理员账号：admin / admin123</p>
        </div>
      </div>
    </div>
  );
} 
