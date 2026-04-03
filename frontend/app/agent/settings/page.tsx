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
import {
  fetchEmbeddingConfig,
  updateEmbeddingConfig,
  type EmbeddingConfig,
  type UpdateEmbeddingConfigRequest,
} from "@/features/agent/services/embeddingConfigApi";
import { useProfile } from "@/features/agent/hooks/useProfile";
import { apiUrl } from "@/lib/config";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/useToast";
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";

export default function SettingsPage(props: any = {}) {
  const { embedded = false } = props;
  const router = useRouter();
  const { t } = useI18n();

  const modelTypeLabel = (mt: string) => {
    const map: Record<string, I18nKey> = {
      text: "agent.settings.modelType.text",
      image: "agent.settings.modelType.image",
      audio: "agent.settings.modelType.audio",
      video: "agent.settings.modelType.video",
    };
    const k = map[mt];
    return k ? t(k) : mt;
  };
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

  // 知识库向量配置（平台级，仅管理员可修改）
  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig | null>(null);
  const [embeddingForm, setEmbeddingForm] = useState({
    embedding_type: "openai",
    api_url: "",
    api_key: "",
    model: "text-embedding-3-small",
    customer_can_use_kb: true,
    visitor_web_search_enabled: false,
    web_search_source: "custom" as "vendor" | "custom",
  });
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [embeddingSubmitting, setEmbeddingSubmitting] = useState(false);
  const [embeddingError, setEmbeddingError] = useState("");

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
      setError(t("agent.settings.error.loadConfigs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadConfigs();
    }
  }, [userId]);

  // 加载知识库向量配置
  const loadEmbeddingConfig = async () => {
    if (!userId) return;
    try {
      setEmbeddingLoading(true);
      const data = await fetchEmbeddingConfig(userId);
      setEmbeddingConfig(data);
      setEmbeddingForm({
        embedding_type: data.embedding_type || "openai",
        api_url: data.api_url || "",
        api_key: "",
        model: data.model || "text-embedding-3-small",
        customer_can_use_kb: data.customer_can_use_kb ?? true,
        visitor_web_search_enabled: data.visitor_web_search_enabled ?? false,
        web_search_source: data.web_search_source === "vendor" ? "vendor" : "custom",
      });
    } catch (e) {
      console.error("加载知识库向量配置失败:", e);
      setEmbeddingError(t("agent.settings.error.loadEmbedding"));
    } finally {
      setEmbeddingLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadEmbeddingConfig();
    }
  }, [userId]);

  // 保存知识库向量配置（仅管理员；保存后立即生效，无需重启）
  const handleSaveEmbeddingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setEmbeddingSubmitting(true);
    setEmbeddingError("");
    try {
      const data: UpdateEmbeddingConfigRequest = {
        embedding_type: embeddingForm.embedding_type,
        api_url: embeddingForm.api_url || undefined,
        model: embeddingForm.model || undefined,
        customer_can_use_kb: embeddingForm.customer_can_use_kb,
        visitor_web_search_enabled: embeddingForm.visitor_web_search_enabled,
        web_search_source: embeddingForm.web_search_source,
      };
      if (embeddingForm.api_key) {
        data.api_key = embeddingForm.api_key;
      }
      await updateEmbeddingConfig(userId, data);
      await loadEmbeddingConfig();
      toast.success(t("agent.settings.toast.embeddingSaved"));
    } catch (err) {
      setEmbeddingError((err as Error).message);
    } finally {
      setEmbeddingSubmitting(false);
    }
  };

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
      setError((error as Error).message || t("agent.settings.error.operation"));
    } finally {
      setSubmitting(false);
    }
  };

  // 删除配置
  const handleDelete = async (id: number) => {
    if (!userId) return;
    if (!confirm(t("agent.settings.confirmDeleteConfig"))) return;

    try {
      await deleteAIConfig(userId, id);
      await loadConfigs();
    } catch (error) {
      setError((error as Error).message || t("agent.settings.error.delete"));
    }
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await fetch(apiUrl("/logout"), { method: "POST" });
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
    <div className="border-b bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("agent.settings.title")}</h1>
          <div className="text-sm text-muted-foreground mt-1">{t("agent.settings.subtitle")}</div>
        </div>
        {!embedded && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => router.push("/agent/dashboard")}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {t("agent.settings.backDashboard")}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {t("agent.logout")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // 构建主内容区
  const mainContent = (
    <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 全局设置 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("agent.settings.section.global")}</CardTitle>
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
                        toast.error(t("agent.settings.toast.profileUpdateFailed"));
                      }
                    }
                  }}
                  disabled={profileLoading}
                />
                <Label
                  htmlFor="receive_ai_conversations"
                  className="text-sm font-medium cursor-pointer"
                >
                  {t("agent.settings.global.noReceiveAi")}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("agent.settings.global.noReceiveAiHint")}
              </p>
            </CardContent>
          </Card>

          {/* 知识库向量模型（平台级，仅管理员可修改；保存后立即生效） */}
          <Card>
            <CardHeader>
              <CardTitle>{t("agent.settings.embedding.title")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("agent.settings.embedding.lead")}
              </p>
            </CardHeader>
            <CardContent>
              {embeddingLoading ? (
                <div className="text-center py-6 text-muted-foreground">{t("common.loading")}</div>
              ) : (
                <form onSubmit={handleSaveEmbeddingConfig} className="space-y-4">
                  {embeddingError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                      {embeddingError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium mb-1">{t("agent.settings.embedding.type")}</Label>
                      <select
                        value={embeddingForm.embedding_type}
                        onChange={(e) =>
                          setEmbeddingForm({ ...embeddingForm, embedding_type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      >
                        <option value="openai">{t("agent.settings.embedding.openaiCompatible")}</option>
                        <option value="bge">{t("agent.settings.embedding.bgeLocal")}</option>
                      </select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-1">{t("agent.settings.embedding.apiUrl")}</Label>
                      <Input
                        value={embeddingForm.api_url}
                        onChange={(e) =>
                          setEmbeddingForm({ ...embeddingForm, api_url: e.target.value })
                        }
                        placeholder={t("agent.settings.embedding.apiUrlPh")}
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-1">{t("agent.settings.embedding.apiKey")}</Label>
                      <Input
                        type="password"
                        value={embeddingForm.api_key}
                        onChange={(e) =>
                          setEmbeddingForm({ ...embeddingForm, api_key: e.target.value })
                        }
                        placeholder={
                          embeddingConfig?.api_key_masked
                            ? t("agent.settings.embedding.apiKeyKeepEmpty")
                            : t("agent.settings.embedding.apiKeyInput")
                        }
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-1">{t("agent.settings.embedding.model")}</Label>
                      <Input
                        value={embeddingForm.model}
                        onChange={(e) =>
                          setEmbeddingForm({ ...embeddingForm, model: e.target.value })
                        }
                        placeholder={t("agent.settings.embedding.modelPh")}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="customer_can_use_kb"
                      checked={embeddingForm.customer_can_use_kb}
                      onCheckedChange={(checked) =>
                        setEmbeddingForm({
                          ...embeddingForm,
                          customer_can_use_kb: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="customer_can_use_kb" className="text-sm cursor-pointer">
                      {t("agent.settings.embedding.customerKb")}
                    </Label>
                  </div>
                  <Button type="submit" disabled={embeddingSubmitting}>
                    {embeddingSubmitting
                      ? t("common.saving")
                      : t("agent.settings.embedding.save")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* 联网搜索设置（与知识库向量模型独立；实际仍写入同一配置，仅 UI 分离） */}
          <Card>
            <CardHeader>
              <CardTitle>{t("agent.settings.webSearch.title")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("agent.settings.webSearch.lead")}
              </p>
            </CardHeader>
            <CardContent>
              {embeddingLoading ? (
                <div className="text-center py-6 text-muted-foreground">{t("common.loading")}</div>
              ) : (
                <form onSubmit={handleSaveEmbeddingConfig} className="space-y-4">
                  {embeddingError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                      {embeddingError}
                    </div>
                  )}
                  <div>
                    <Label className="block text-sm font-medium mb-1">{t("agent.settings.webSearch.mode")}</Label>
                    <select
                      value={embeddingForm.web_search_source}
                      onChange={(e) =>
                        setEmbeddingForm({
                          ...embeddingForm,
                          web_search_source: e.target.value as "vendor" | "custom",
                        })
                      }
                      className="w-full max-w-xs px-3 py-2 border border-input rounded-md text-sm bg-background"
                    >
                      <option value="custom">{t("agent.settings.webSearch.modeCustom")}</option>
                      <option value="vendor">{t("agent.settings.webSearch.modeVendor")}</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("agent.settings.webSearch.modeHint")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="visitor_web_search_enabled_standalone"
                      checked={embeddingForm.visitor_web_search_enabled}
                      onCheckedChange={(checked) =>
                        setEmbeddingForm({
                          ...embeddingForm,
                          visitor_web_search_enabled: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="visitor_web_search_enabled_standalone" className="text-sm cursor-pointer">
                      {t("agent.settings.webSearch.visitorToggle")}
                    </Label>
                  </div>
                  <Button type="submit" disabled={embeddingSubmitting}>
                    {embeddingSubmitting ? t("common.saving") : t("agent.settings.webSearch.save")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* 配置表单 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId
                  ? t("agent.settings.aiCard.titleEdit")
                  : t("agent.settings.aiCard.titleAdd")}
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
                      {t("agent.settings.aiForm.provider")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.provider}
                      onChange={(e) =>
                        setFormData({ ...formData, provider: e.target.value })
                      }
                      placeholder={t("agent.settings.aiForm.providerPh")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("agent.settings.aiForm.apiUrl")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.api_url}
                      onChange={(e) =>
                        setFormData({ ...formData, api_url: e.target.value })
                      }
                      placeholder={t("agent.settings.aiForm.apiUrlPh")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("agent.settings.aiForm.apiKey")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) =>
                        setFormData({ ...formData, api_key: e.target.value })
                      }
                      placeholder={
                        editingId
                          ? t("agent.settings.embedding.apiKeyKeepEmpty")
                          : t("agent.settings.embedding.apiKeyInput")
                      }
                      required={!editingId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("agent.settings.aiForm.model")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder={t("agent.settings.aiForm.modelPh")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("agent.settings.aiForm.modelType")}
                    </label>
                    <select
                      value={formData.model_type}
                      onChange={(e) =>
                        setFormData({ ...formData, model_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="text">{t("agent.settings.modelType.text")}</option>
                      <option value="image">{t("agent.settings.modelType.image")}</option>
                      <option value="audio">{t("agent.settings.modelType.audio")}</option>
                      <option value="video">{t("agent.settings.modelType.video")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("agent.settings.aiForm.description")}
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t("agent.settings.aiForm.descPh")}
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
                    <span className="text-sm">{t("agent.settings.aiForm.active")}</span>
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
                    <span className="text-sm">{t("agent.settings.aiForm.public")}</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? t("agent.settings.aiForm.submitting")
                      : editingId
                        ? t("agent.settings.aiForm.submitUpdate")
                        : t("agent.settings.aiForm.submitCreate")}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      {t("agent.common.cancel")}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 配置列表 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("agent.settings.list.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  {t("common.loading")}
                </div>
              ) : configs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("agent.settings.list.empty")}
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
                                {t("agent.settings.badge.active")}
                              </span>
                            )}
                            {config.is_public && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {t("agent.settings.badge.public")}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium">{t("agent.settings.list.apiUrlLabel")}</span>
                              {config.api_url}
                            </p>
                            <p>
                              <span className="font-medium">{t("agent.settings.list.modelTypeLabel")}</span>
                              {modelTypeLabel(config.model_type)}
                            </p>
                            {config.description && (
                              <p>
                                <span className="font-medium">{t("agent.settings.list.descLabel")}</span>
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
                            {t("agent.common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(config.id)}
                          >
                            {t("agent.common.delete")}
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

