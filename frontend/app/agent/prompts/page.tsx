"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPrompts, updatePrompt, type PromptItem } from "@/features/agent/services/promptsApi";
import { toast } from "@/hooks/useToast";
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";

const PROMPT_HINT_KEYS: Partial<Record<string, I18nKey>> = {
  rag_prompt: "agent.prompts.hint.rag_prompt",
  rag_prompt_with_web_optional: "agent.prompts.hint.rag_prompt_with_web_optional",
  no_kb_prompt: "agent.prompts.hint.no_kb_prompt",
  web_search_result_prompt: "agent.prompts.hint.web_search_result_prompt",
  no_source_reply: "agent.prompts.hint.no_source_reply",
  ai_fail_reply: "agent.prompts.hint.ai_fail_reply",
};

const PROMPT_USAGE_KEYS: Partial<Record<string, I18nKey>> = {
  rag_prompt: "agent.prompts.usage.rag_prompt",
  rag_prompt_with_web_optional: "agent.prompts.usage.rag_prompt_with_web_optional",
  no_kb_prompt: "agent.prompts.usage.no_kb_prompt",
  web_search_result_prompt: "agent.prompts.usage.web_search_result_prompt",
  no_source_reply: "agent.prompts.usage.no_source_reply",
  ai_fail_reply: "agent.prompts.usage.ai_fail_reply",
};

function getTextareaMinHeight(key: string): string {
  return key === "no_source_reply" || key === "ai_fail_reply" ? "min-h-[80px]" : "min-h-[200px]";
}

export default function PromptsPage({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const [userId, setUserId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("agent_user_id");
    if (!storedUserId) {
      router.push("/");
      return;
    }
    setUserId(Number.parseInt(storedUserId, 10));
  }, [router]);

  const loadPrompts = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchPrompts(userId);
      setPrompts(data);
    } catch (e) {
      console.error("加载提示词失败:", e);
      setError((e as Error).message || t("agent.prompts.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadPrompts();
  }, [userId]);

  const handleSave = async (key: string, content: string) => {
    if (!userId) return;
    setSavingKey(key);
    try {
      await updatePrompt(userId, key, content);
      toast.success(t("agent.prompts.saveSuccess"));
      await loadPrompts();
    } catch (e) {
      toast.error((e as Error).message || t("agent.prompts.saveFailed"));
    } finally {
      setSavingKey(null);
    }
  };

  const handleContentChange = (key: string, content: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.key === key ? { ...p, content } : p))
    );
  };

  if (!userId) return null;

  const headerContent = (
    <div className="border-b bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("agent.prompts.title")}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {t("agent.prompts.subtitle")}
          </div>
        </div>
        {!embedded && (
          <Button
            onClick={() => router.push("/agent/dashboard")}
            variant="outline"
            size="sm"
          >
            {t("agent.settings.backDashboard")}
          </Button>
        )}
      </div>
    </div>
  );

  const mainContent = (
    <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
        ) : (
          prompts.map((item) => {
            const usageKey = PROMPT_USAGE_KEYS[item.key];
            const hintKey = PROMPT_HINT_KEYS[item.key] ?? "agent.prompts.hint.default";
            return (
              <Card key={item.key}>
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  {usageKey && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{t("agent.prompts.usageLabel")}</span>
                      {t(usageKey)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t(hintKey)}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    className={`w-full ${getTextareaMinHeight(item.key)} px-3 py-2 border border-input rounded-md text-sm bg-background font-mono resize-y`}
                    value={item.content}
                    onChange={(e) => handleContentChange(item.key, e.target.value)}
                    placeholder={
                      item.key === "no_source_reply" || item.key === "ai_fail_reply"
                        ? t("agent.prompts.ph.shortReply")
                        : t("agent.prompts.ph.withPlaceholders")
                    }
                    spellCheck={false}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(item.key, item.content)}
                    disabled={savingKey === item.key}
                  >
                    {savingKey === item.key ? t("agent.prompts.saving") : t("agent.prompts.save")}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {headerContent}
        {mainContent}
      </div>
    );
  }

  return (
    <ResponsiveLayout header={headerContent} main={mainContent} />
  );
}
