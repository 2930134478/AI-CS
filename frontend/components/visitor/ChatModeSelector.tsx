"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchPublicAIModels, type AIConfig } from "@/features/agent/services/aiConfigApi";

interface ChatModeSelectorProps {
  onSelect: (mode: "human" | "ai", aiConfigId?: number) => void;
  loading?: boolean;
}

export function ChatModeSelector({ onSelect, loading }: ChatModeSelectorProps) {
  const [aiModels, setAiModels] = useState<AIConfig[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

  // 加载开放的 AI 模型列表
  useEffect(() => {
    async function loadModels() {
      try {
        const models = await fetchPublicAIModels("text");
        setAiModels(models);
        // 如果有模型，默认选择第一个
        if (models.length > 0) {
          setSelectedModel(models[0].id);
        }
      } catch (error) {
        console.error("加载模型列表失败:", error);
      } finally {
        setLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  const handleSelectHuman = () => {
    onSelect("human");
  };

  const handleSelectAI = () => {
    if (selectedModel) {
      onSelect("ai", selectedModel);
    } else if (aiModels.length > 0) {
      // 如果没有选择，使用第一个模型
      onSelect("ai", aiModels[0].id);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          欢迎使用客服系统
        </h1>
        <p className="text-center text-gray-600 mb-8">
          请选择您需要的服务方式
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 人工客服选项 */}
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">人工客服</h3>
              <p className="text-sm text-gray-600 mb-4">
                由专业客服人员为您提供一对一服务
              </p>
              <Button
                onClick={handleSelectHuman}
                disabled={loading}
                className="w-full"
              >
                {loading ? "连接中..." : "选择人工客服"}
              </Button>
            </div>
          </Card>

          {/* AI 客服选项 */}
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI 客服</h3>
              <p className="text-sm text-gray-600 mb-4">
                智能 AI 助手，24 小时在线为您服务
              </p>
              {loadingModels ? (
                <div className="w-full py-2 text-sm text-gray-500">
                  加载模型中...
                </div>
              ) : aiModels.length === 0 ? (
                <div className="w-full py-2 text-sm text-red-500">
                  暂无可用的 AI 模型
                </div>
              ) : (
                <>
                  {/* 模型选择下拉框 */}
                  <select
                    value={selectedModel || ""}
                    onChange={(e) => setSelectedModel(Number(e.target.value))}
                    className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={loading}
                  >
                    {aiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.provider} - {model.model}
                        {model.description ? ` (${model.description})` : ""}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleSelectAI}
                    disabled={loading || !selectedModel}
                    variant="default"
                    className="w-full"
                  >
                    {loading ? "连接中..." : "选择 AI 客服"}
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

