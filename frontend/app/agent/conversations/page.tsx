"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";

// 对话类型定义
interface Conversation {
  id: number;
  visitor_id: number;
  agent_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const router = useRouter();

  // 检查是否已登录
  useEffect(() => {
    const userId = localStorage.getItem("agent_user_id");
    const savedUsername = localStorage.getItem("agent_username");
    const savedRole = localStorage.getItem("agent_role");

    if (!userId || !savedUsername) {
      // 未登录，跳转到登录页面
      router.push("/");
      return;
    }

    setUsername(savedUsername);
    setRole(savedRole || "");
  }, [router]);

  // 拉取对话列表
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/conversations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setConversations(data);
        }
      } else {
        console.error("获取对话列表失败");
      }
    } catch (error) {
      console.error("获取对话列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时拉取对话列表
  useEffect(() => {
    const userId = localStorage.getItem("agent_user_id");
    if (userId) {
      fetchConversations();
    }
  }, []);

  // 退出登录
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      // 清空本地存储
      localStorage.removeItem("agent_user_id");
      localStorage.removeItem("agent_username");
      localStorage.removeItem("agent_role");
      // 跳转到登录页面
      router.push("/");
    }
  };

  // 格式化时间显示
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 今天：只显示时间
    if (diff < 24 * 3600 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // 更早：显示日期+时间
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 点击对话，跳转到聊天页面
  const handleConversationClick = (conversationId: number) => {
    router.push(`/agent/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-card border-b p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-foreground">对话列表</h1>
            <div className="text-sm text-muted-foreground mt-1">
              {username} ({role === "admin" ? "管理员" : "客服"})
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            退出登录
          </Button>
        </div>
      </div>

      {/* 对话列表区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            暂无对话
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        对话 #{conv.id}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          conv.status === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {conv.status === "open" ? "进行中" : conv.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      访客ID: {conv.visitor_id}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      创建时间: {formatTime(conv.created_at)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    最后更新: {formatTime(conv.updated_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

