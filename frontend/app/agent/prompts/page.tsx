"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPrompts, updatePrompt, type PromptItem } from "@/features/agent/services/promptsApi";
import { toast } from "@/hooks/useToast";

function getPlaceholderHint(key: string): string {
  switch (key) {
    case "rag_prompt":
    case "rag_prompt_with_web_optional":
      return "占位符：{{rag_context}} 为知识库检索内容，{{user_message}} 为用户问题。";
    case "no_kb_prompt":
      return "占位符：{{user_message}} 为用户问题。";
    case "web_search_result_prompt":
      return "占位符：{{web_context}} 为联网搜索结果，{{user_message}} 为用户问题。（当前流程未使用此模板）";
    case "no_source_reply":
    case "ai_fail_reply":
      return "无占位符，内容将作为完整回复语直接展示给用户。";
    default:
      return "请勿删除占位符，保存后由系统替换为实际内容。";
  }
}

/** 各提示词的使用场景说明（展示在卡片中） */
function getUsageScenario(key: string): string {
  switch (key) {
    case "rag_prompt":
      return "有知识库检索结果，且本回合未勾选「联网搜索」时，用此模板拼成 prompt 发给模型。";
    case "rag_prompt_with_web_optional":
      return "有知识库检索结果且本回合勾选「联网搜索」时，用此模板并传入联网工具，由模型决定是否调用联网。";
    case "no_kb_prompt":
      return "没有知识库检索结果且本回合未走联网时，用此模板让模型仅凭自身知识回答。";
    case "web_search_result_prompt":
      return "预留：若将来有「先联网搜再拼成一段 prompt」的流程，会使用此模板。当前未使用。";
    case "no_source_reply":
      return "既未命中知识库、也未使用大模型或联网时（如用户关闭了所有数据源），直接向用户展示这句话。";
    case "ai_fail_reply":
      return "调用 AI 接口失败（超时、报错等）时，向用户展示这句话。";
    default:
      return "";
  }
}

function getTextareaMinHeight(key: string): string {
  return key === "no_source_reply" || key === "ai_fail_reply" ? "min-h-[80px]" : "min-h-[200px]";
}

export default function PromptsPage({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
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
      setError((e as Error).message || "加载提示词失败");
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
      toast.success("保存成功，将立即生效。");
      await loadPrompts();
    } catch (e) {
      toast.error((e as Error).message || "保存失败");
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
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">提示词</h1>
          <div className="text-sm text-muted-foreground mt-1">
            配置系统中使用的提示词模板，用于 RAG、联网等场景。仅管理员可修改。占位符说明见下方各卡片。
          </div>
        </div>
        {!embedded && (
          <Button
            onClick={() => router.push("/agent/dashboard")}
            variant="outline"
            size="sm"
          >
            返回工作台
          </Button>
        )}
      </div>
    </div>
  );

  const mainContent = (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : (
          prompts.map((item) => (
            <Card key={item.key}>
              <CardHeader>
                <CardTitle className="text-base">{item.name}</CardTitle>
                {getUsageScenario(item.key) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">使用场景：</span>
                    {getUsageScenario(item.key)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{getPlaceholderHint(item.key)}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className={`w-full ${getTextareaMinHeight(item.key)} px-3 py-2 border border-input rounded-md text-sm bg-background font-mono resize-y`}
                  value={item.content}
                  onChange={(e) => handleContentChange(item.key, e.target.value)}
                  placeholder={item.key === "no_source_reply" || item.key === "ai_fail_reply" ? "请输入一句完整回复语" : "请输入提示词内容，保留占位符"}
                  spellCheck={false}
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(item.key, item.content)}
                  disabled={savingKey === item.key}
                >
                  {savingKey === item.key ? "保存中..." : "保存"}
                </Button>
              </CardContent>
            </Card>
          ))
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
