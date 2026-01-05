"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchAIConfigs,
  createAIConfig,
  updateAIConfig,
  deleteAIConfig,
  type AIConfig,
  type CreateAIConfigRequest,
  type UpdateAIConfigRequest,
} from "@/features/agent/services/aiConfigApi";
import { useProfile } from "@/features/agent/hooks/useProfile";
import { API_BASE_URL } from "@/lib/config";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function SettingsPage(props: any = {}) {
  const { embedded = false } = props;
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateAIConfigRequest>({
    provider: "",
    api_url: "",
    api_key: "",
    model: "",
    model_type: "text",
    is_active: true,
    is_public: false,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 检查登录状态
  useEffect(() => {
    const storedUserId = localStorage.getItem("agent_user_id");
    if (!storedUserId) {
      router.push("/");
      return;
    }
    setUserId(Number.parseInt(storedUserId, 10));
  }, [router]);

  // 加载个人资料（用于获取和更新 AI 对话接收设置）
  const {
    profile,
    loading: profileLoading,
    update: updateProfile,
  } = useProfile({
    userId: userId ?? null,
    enabled: Boolean(userId),
  });

  // 加载配置列表
  const loadConfigs = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await fetchAIConfigs(userId);
      setConfigs(data);
    } catch (error) {
      console.error("加载配置失败:", error);
      setError("加载配置失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadConfigs();
    }
  }, [userId]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      provider: "",
      api_url: "",
      api_key: "",
      model: "",
      model_type: "text",
      is_active: true,
      is_public: false,
      description: "",
    });
    setEditingId(null);
    setError("");
  };

  // 开始编辑
  const handleEdit = (config: AIConfig) => {
    setFormData({
      provider: config.provider,
      api_url: config.api_url,
      api_key: "", // 不显示 API Key（已加密）
      model: config.model,
      model_type: config.model_type,
      is_active: config.is_active,
      is_public: config.is_public,
      description: config.description,
    });
    setEditingId(config.id);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    setError("");

    try {
      if (editingId) {
        // 更新配置
        const updateData: UpdateAIConfigRequest = {
          provider: formData.provider,
          api_url: formData.api_url,
          model: formData.model,
          model_type: formData.model_type,
          is_active: formData.is_active,
          is_public: formData.is_public,
          description: formData.description,
        };
        // 如果提供了新的 API Key，才更新
        if (formData.api_key) {
          updateData.api_key = formData.api_key;
        }
        await updateAIConfig(userId, editingId, updateData);
      } else {
        // 创建配置
        await createAIConfig(userId, formData);
      }
      resetForm();
      await loadConfigs();
    } catch (error) {
      setError((error as Error).message || "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除配置
  const handleDelete = async (id: number) => {
    if (!userId) return;
    if (!confirm("确定要删除这个配置吗？")) return;

    try {
      await deleteAIConfig(userId, id);
      await loadConfigs();
    } catch (error) {
      setError((error as Error).message || "删除失败");
    }
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, { method: "POST" });
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      localStorage.removeItem("agent_user_id");
      localStorage.removeItem("agent_username");
      localStorage.removeItem("agent_role");
      router.push("/");
    }
  };

  if (!userId) {
    return null;
  }

  // 构建头部内容
  const headerContent = (
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI 配置管理</h1>
          <div className="text-sm text-muted-foreground mt-1">管理 AI 服务商配置</div>
        </div>
        {!embedded && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => router.push("/agent/dashboard")}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              返回工作台
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              退出登录
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // 构建主内容区
  const mainContent = (
    <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 全局设置 */}
          <Card>
            <CardHeader>
              <CardTitle>全局设置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="receive_ai_conversations"
                  checked={!(profile?.receive_ai_conversations ?? false)}
                  onCheckedChange={async (checked) => {
                    if (userId) {
                      try {
                        await updateProfile({
                          receive_ai_conversations: !checked,
                        });
                      } catch (error) {
                        console.error("更新设置失败:", error);
                        alert("更新设置失败，请重试");
                      }
                    }
                  }}
                  disabled={profileLoading}
                />
                <Label
                  htmlFor="receive_ai_conversations"
                  className="text-sm font-medium cursor-pointer"
                >
                  客服不接收 AI 对话
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                开启后，AI 对话将不会显示在对话列表中，也不会收到 AI 消息通知。
                但您仍可以在会话页面手动开启&quot;显示 AI 消息&quot;来查看 AI 对话历史。
              </p>
            </CardContent>
          </Card>

          {/* 配置表单 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "编辑 AI 配置" : "添加 AI 配置"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      服务商名称 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.provider}
                      onChange={(e) =>
                        setFormData({ ...formData, provider: e.target.value })
                      }
                      placeholder="例如：OpenAI、Claude、自定义"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      API 地址 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.api_url}
                      onChange={(e) =>
                        setFormData({ ...formData, api_url: e.target.value })
                      }
                      placeholder="https://api.openai.com/v1/chat/completions"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) =>
                        setFormData({ ...formData, api_key: e.target.value })
                      }
                      placeholder={editingId ? "留空则不更新" : "输入 API Key"}
                      required={!editingId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      模型名称 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder="例如：gpt-3.5-turbo、gpt-4"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      模型类型
                    </label>
                    <select
                      value={formData.model_type}
                      onChange={(e) =>
                        setFormData({ ...formData, model_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="text">文本</option>
                      <option value="image">图片</option>
                      <option value="audio">语音</option>
                      <option value="video">视频</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    配置描述
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="例如：OpenAI GPT-3.5 Turbo 模型"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">启用配置</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) =>
                        setFormData({ ...formData, is_public: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">开放给访客使用</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "提交中..."
                      : editingId
                        ? "更新配置"
                        : "创建配置"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      取消
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 配置列表 */}
          <Card>
            <CardHeader>
              <CardTitle>已配置的 AI 服务</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  加载中...
                </div>
              ) : configs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无配置，请添加
                </div>
              ) : (
                <div className="space-y-4">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {config.provider} - {config.model}
                            </h3>
                            {config.is_active && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                启用
                              </span>
                            )}
                            {config.is_public && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                开放
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium">API 地址：</span>
                              {config.api_url}
                            </p>
                            <p>
                              <span className="font-medium">模型类型：</span>
                              {config.model_type}
                            </p>
                            {config.description && (
                              <p>
                                <span className="font-medium">描述：</span>
                                {config.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(config)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(config.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );

  // 如果是嵌入模式，只返回内容，不包含 ResponsiveLayout
  if (embedded) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {headerContent}
        {mainContent}
      </div>
    );
  }

  return (
    <ResponsiveLayout
      main={mainContent}
      header={headerContent}
    />
  );
}

