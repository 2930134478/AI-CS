"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageList } from "@/components/dashboard/MessageList";
import { MessageInput } from "@/components/dashboard/MessageInput";
import { OnlineAgentsList, type OnlineAgent } from "./OnlineAgentsList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { websiteConfig } from "@/lib/website-config";
import {
  ChatWebSocketPayload,
  MessageItem,
  MessagesReadPayload,
} from "@/features/agent/types";
import {
  fetchMessages,
  markMessagesRead,
  sendMessage,
  UploadFileResult,
} from "@/features/agent/services/messageApi";
import { initVisitorConversation } from "@/features/visitor/services/conversationApi";
import { fetchOnlineAgents } from "@/features/visitor/services/visitorApi";
import { fetchPublicAIModels } from "@/features/agent/services/aiConfigApi";
import { useWebSocket } from "@/features/agent/hooks/useWebSocket";
import type { WSMessage } from "@/lib/websocket";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { playNotificationSound } from "@/utils/sound";
import { Loader2 } from "lucide-react";

interface ChatWidgetProps {
  visitorId: number;
  isOpen: boolean;
  onToggle: () => void;
}

function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  let browser = "Unknown";
  let os = "Unknown";

  if (ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("chrome/")) {
    browser = "Chrome";
  } else if (ua.includes("firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("safari/")) {
    browser = "Safari";
  }

  if (ua.includes("windows nt")) {
    os = "Windows";
  } else if (ua.includes("mac os x") || ua.includes("macintosh")) {
    os = "macOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  return { browser, os };
}

/**
 * 聊天小窗组件
 * 提供小窗形式的聊天界面，支持展开/收起
 */
export function ChatWidget({ visitorId, isOpen, onToggle }: ChatWidgetProps) {
  // ===== 状态管理 =====
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string>("open");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<"human" | "ai">("human");
  const [initializing, setInitializing] = useState(false);
  const [selectedAIConfigId, setSelectedAIConfigId] = useState<
    number | undefined
  >(undefined);
  const [aiModels, setAiModels] = useState<
    Array<{ id: number; provider: string; model: string }>
  >([]);
  const [onlineAgents, setOnlineAgents] = useState<OnlineAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  /** AI 模式下发消息后等待回复时显示「正在输入」提示 */
  const [aiTyping, setAiTyping] = useState(false);

  // 声音通知开关（访客端）
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundNotification(true);

  const noopHighlight = useCallback(() => {}, []);

  // 加载在线客服列表
  const loadOnlineAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const agents = await fetchOnlineAgents();
      setOnlineAgents(agents);
    } catch (error) {
      console.error("加载在线客服列表失败:", error);
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  // 当小窗打开时，加载在线客服列表
  useEffect(() => {
    if (isOpen) {
      loadOnlineAgents();
      // 定期刷新在线客服列表（每30秒）
      const interval = setInterval(loadOnlineAgents, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, loadOnlineAgents]);

  // 加载开放的 AI 模型列表
  useEffect(() => {
    async function loadModels() {
      try {
        const models = await fetchPublicAIModels("text");
        setAiModels(models);
        if (models.length > 0) {
          setSelectedAIConfigId(models[0].id);
        }
      } catch (error) {
        console.error("加载 AI 模型列表失败:", error);
      }
    }
    loadModels();
  }, []);

  // 创建或恢复访客会话
  const initializeConversation = useCallback(
    async (id: number, mode: "human" | "ai", aiConfigId?: number) => {
      setInitializing(true);
      try {
        const { browser, os } = parseUserAgent(navigator.userAgent);
        const language =
          navigator.language ||
          (navigator.languages && navigator.languages[0]) ||
          "";
        const result = await initVisitorConversation({
          visitorId: id,
          website: window.location.href,
          referrer: document.referrer || "",
          browser,
          os,
          language,
          chatMode: mode,
          aiConfigId,
        });
        if (result.conversation_id) {
          setConversationId(result.conversation_id);
          setConversationStatus(result.status);
          setChatMode(mode);
        }
      } catch (error) {
        console.error("初始化对话失败:", error);
        alert("初始化对话失败，请重试");
      } finally {
        setInitializing(false);
      }
    },
    []
  );

  // 初始化默认对话（人工模式）
  useEffect(() => {
    if (visitorId !== null && !conversationId && !initializing && isOpen) {
      initializeConversation(visitorId, "human");
    }
  }, [visitorId, conversationId, initializing, isOpen, initializeConversation]);

  // 处理模式切换
  const handleModeSwitch = useCallback(
    (mode: "human" | "ai") => {
      if (visitorId === null || initializing) {
        return;
      }
      if (mode === "ai" && !selectedAIConfigId) {
        alert("请先选择一个 AI 模型");
        return;
      }
      initializeConversation(
        visitorId,
        mode,
        mode === "ai" ? selectedAIConfigId : undefined
      );
    },
    [visitorId, initializing, selectedAIConfigId, initializeConversation]
  );

  // 标记客服消息已读
  const handleMarkAgentMessagesRead = useCallback(
    async (conversationIdParam?: number, readerIsAgentParam?: boolean) => {
      const targetConversationId = conversationIdParam ?? conversationId;
      const targetReaderIsAgent = readerIsAgentParam ?? false;
      if (!targetConversationId) {
        return;
      }
      const result = await markMessagesRead(
        targetConversationId,
        targetReaderIsAgent
      );
      if (!result || result.message_ids.length === 0) {
        return;
      }
      const idSet = new Set(result.message_ids);
      setMessages((prev) =>
        prev.map((msg) =>
          idSet.has(msg.id)
            ? {
                ...msg,
                is_read: true,
                read_at: result.read_at ?? msg.read_at ?? null,
              }
            : msg
        )
      );
    },
    [conversationId]
  );

  // 拉取历史消息（AI 模式时包含 AI 对话记录，人工模式时仅人工消息）
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    setLoadingMessages(true);
    try {
      const includeAIMessages = chatMode === "ai";
      const data = await fetchMessages(conversationId, includeAIMessages);
      const normalizedMessages = data.map((msg) => ({
        ...msg,
        is_read: msg.is_read ?? false,
        read_at: msg.read_at ?? null,
      }));
      setMessages(normalizedMessages);
    } catch (error) {
      console.error("拉取消息失败:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId, chatMode]);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadMessages();
    }
  }, [isOpen, conversationId, loadMessages]);


  // 收到新消息时更新状态
  const handleNewMessage = useCallback(
    (message: MessageItem) => {
      if (!conversationId || message.conversation_id !== conversationId) {
        return;
      }
      
      // 如果是客服发送的消息（不是访客自己发送的）且开启声音，播放提示音
      if (message.sender_is_agent && soundEnabled) {
        playNotificationSound();
      }
      
      setMessages((prev) => {
        // 检查是否已存在相同ID的消息（真实消息）
        const exists = prev.some((item) => item.id === message.id);
        if (exists) {
          // 更新已存在的消息，确保创建新数组引用
          const updated = prev.map((msg) =>
            msg.id === message.id
              ? {
                  ...msg,
                  ...message,
                  is_read: message.is_read ?? msg.is_read ?? false,
                  read_at: message.read_at ?? msg.read_at ?? null,
                }
              : msg
          );
          // 检查是否有实际变化，如果没有变化也返回新数组引用
          const hasChange = updated.some((msg, idx) => {
            const oldMsg = prev[idx];
            return !oldMsg || msg.id !== oldMsg.id || JSON.stringify(msg) !== JSON.stringify(oldMsg);
          });
          if (!hasChange) {
            return [...updated]; // 强制创建新数组引用
          }
          return updated;
        }
        
        // 如果是访客自己发送的消息（sender_is_agent = false），移除对应的临时消息
        // 临时消息的 ID 是 Date.now()，通常大于 1000000000000
        // 真实消息的 ID 通常较小
        const isVisitorMessage = !message.sender_is_agent;
        if (isVisitorMessage) {
          // 移除所有临时消息（ID 大于 1000000000000）和已存在的相同真实消息（如果有）
          // 这样可以避免临时消息和真实消息重复显示
          const filteredPrev = prev.filter((msg) => 
            msg.id < 1000000000000 && msg.id !== message.id
          );
          
          // 检查过滤后的数组和原数组是否不同，或者消息ID是否变化
          const hasTempMessage = prev.some((msg) => msg.id >= 1000000000000);
          const hasSameMessage = prev.some((msg) => msg.id === message.id);
          
          // 如果列表没有变化（没有临时消息需要移除，且消息已存在），仍然创建新数组引用
          if (!hasTempMessage && hasSameMessage) {
            // 即使没有变化，也创建新数组引用，确保 React 检测到变化
            return [...prev];
          }
          
          // 确保新消息不在列表中，然后添加
          // 检查过滤后的列表是否已包含该消息
          const alreadyInFiltered = filteredPrev.some((msg) => msg.id === message.id);
          if (alreadyInFiltered) {
            // 即使已存在，也创建新数组引用以确保渲染
            return [...filteredPrev];
          }
          
          const newMessages = [
            ...filteredPrev,
            {
              ...message,
              is_read: message.is_read ?? false,
            },
          ];
          
          // 强制创建新数组引用，确保 React 检测到变化
          return newMessages;
        }
        
        // 其他消息（客服发送的）直接添加
        // 检查是否已存在，避免重复添加
        const alreadyExists = prev.some((msg) => msg.id === message.id);
        if (alreadyExists) {
          // 即使消息已存在，也创建新数组引用，确保 React 检测到变化
          return [...prev];
        }
        const newMessages = [
          ...prev,
          {
            ...message,
            is_read: message.is_read ?? false,
          },
        ];
        // 强制创建新数组引用，确保 React 检测到变化
        return newMessages;
      });
    },
    [conversationId]
  );

  // 处理 WebSocket 的已读事件
  const handleMessagesReadEvent = useCallback(
    (payload: MessagesReadPayload) => {
      if (!conversationId) {
        return;
      }
      const payloadConversationId = payload?.conversation_id;
      if (payloadConversationId && payloadConversationId !== conversationId) {
        return;
      }
      if (payload?.reader_is_agent !== true) {
        return;
      }
      const ids = Array.isArray(payload?.message_ids)
        ? payload.message_ids
        : [];
      if (ids.length === 0) {
        return;
      }
      const idSet = new Set(ids);
      const readAt = payload?.read_at;
      setMessages((prev) =>
        prev.map((msg) =>
          idSet.has(msg.id) && !msg.sender_is_agent
            ? {
                ...msg,
                is_read: true,
                read_at: readAt ?? msg.read_at ?? null,
              }
            : msg
        )
      );
    },
    [conversationId]
  );

  const handleWebSocketMessage = useCallback(
    (event: WSMessage<ChatWebSocketPayload>) => {
      if (!event) {
        return;
      }
      if (event.type === "new_message" && event.data) {
        const msg = event.data as MessageItem;
        handleNewMessage(msg);
        // AI 模式下收到对方（客服/AI）回复时关闭「正在输入」提示
        if (chatMode === "ai" && msg.sender_is_agent) {
          setAiTyping(false);
        }
      } else if (event.type === "messages_read") {
        const payload = event.data as MessagesReadPayload;
        if (!payload.conversation_id && event.conversation_id) {
          payload.conversation_id = event.conversation_id;
        }
        handleMessagesReadEvent(payload);
      }
        },
        [handleMessagesReadEvent, handleNewMessage, soundEnabled, chatMode]
      );

  useWebSocket<ChatWebSocketPayload>({
    conversationId,
    enabled: Boolean(conversationId) && isOpen,
    isVisitor: true,
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error("WebSocket 连接错误（访客端）:", error);
    },
  });

  const handleSendMessage = useCallback(
    async (fileInfo?: UploadFileResult) => {
      if (!conversationId || sending) {
        return;
      }
      if (!input.trim() && !fileInfo) {
        return;
      }
      const messageContent = input.trim();
      
      // 乐观更新：立即将消息添加到本地状态（临时消息，稍后会被服务器返回的真实消息替换）
      const tempMessage: MessageItem = {
        id: Date.now(), // 临时ID，发送成功后会被真实ID替换
        conversation_id: conversationId,
        content: messageContent,
        sender_id: visitorId || 0,
        sender_is_agent: false,
        message_type: fileInfo?.file_type === "image" ? "image" : fileInfo?.file_type === "document" ? "document" : "text",
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        file_url: fileInfo?.file_url || null,
        file_name: fileInfo?.file_name || null,
        file_size: fileInfo?.file_size || null,
        mime_type: fileInfo?.mime_type || null,
        chat_mode: chatMode,
      };
      
      // 立即添加到消息列表
      setMessages((prev) => [...prev, tempMessage]);
      setInput("");
      setSending(true);
      if (chatMode === "ai") {
        setAiTyping(true);
      }

      try {
        await sendMessage({
          conversationId,
          content: messageContent,
          senderIsAgent: false,
          fileUrl: fileInfo?.file_url,
          fileType: fileInfo?.file_type as "image" | "document" | undefined,
          fileName: fileInfo?.file_name,
          fileSize: fileInfo?.file_size,
          mimeType: fileInfo?.mime_type,
        });
        
        // 不在这里调用 loadMessages，完全依赖 WebSocket 来接收新消息
        // WebSocket 会收到服务器广播的消息，包括自己发送的消息
        // 这样可以避免 loadMessages 覆盖 WebSocket 的更新
      } catch (error) {
        // 发送失败，移除临时消息
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        if (chatMode === "ai") setAiTyping(false);
        console.error("❌ 发送消息失败:", error);
        alert((error as Error).message || "发送消息失败，请稍后重试");
        // 恢复输入内容
        setInput(messageContent);
      } finally {
        setSending(false);
      }
    },
    [conversationId, input, sending, visitorId, chatMode]
  );

  // 如果不打开，不渲染内容
  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] max-w-[400px] h-[500px] sm:w-[400px] sm:max-w-none sm:h-[600px] md:w-[480px] md:h-[700px] flex flex-col shadow-2xl z-40 border border-border/50 overflow-hidden rounded-2xl bg-background backdrop-blur-sm ring-1 ring-black/5">
      {/* 头部：标题和操作按钮 - 使用渐变背景 */}
      <div className="bg-gradient-to-r from-primary to-primary/80 border-b border-primary/20 p-4 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">客服聊天</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* 声音开关按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg transition-colors"
            aria-label={soundEnabled ? "关闭声音" : "开启声音"}
            title={soundEnabled ? "关闭声音提示" : "开启声音提示"}
          >
            {soundEnabled ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            )}
          </Button>
          {/* GitHub 链接按钮 */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg transition-colors"
            aria-label="GitHub"
            title="查看 GitHub 仓库"
          >
            <a
              href={websiteConfig.github.repo}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </Button>
        </div>
      </div>

      {/* 模式切换和在线客服列表 */}
      <div className="p-4 border-b bg-gradient-to-b from-muted/50 to-background">
        {/* 模式切换按钮 */}
        <div className="flex items-center gap-2 mb-3 justify-center">
          <Button
            variant={chatMode === "human" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeSwitch("human")}
            disabled={initializing}
            className={
              chatMode === "human"
                ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
                : "hover:bg-muted border-border"
            }
          >
            人工客服
          </Button>
          <Button
            variant={chatMode === "ai" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeSwitch("ai")}
            disabled={initializing || aiModels.length === 0 || !selectedAIConfigId}
            className={
              chatMode === "ai"
                ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
                : "hover:bg-muted border-border"
            }
          >
            AI 客服
          </Button>
        </div>
        {/* AI 模型选择下拉框（仅 AI 模式显示） */}
        {aiModels.length > 0 && chatMode === "ai" && (
          <div className="flex justify-center mb-3">
            <select
              value={selectedAIConfigId || ""}
              onChange={(e) => {
                const configId = Number(e.target.value);
                setSelectedAIConfigId(configId);
                if (visitorId) {
                  initializeConversation(visitorId, "ai", configId);
                }
              }}
              disabled={initializing}
              className="px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              {aiModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.provider} - {model.model}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* 在线客服列表（仅人工模式显示） */}
        {chatMode === "human" && (
          <OnlineAgentsList
            agents={onlineAgents}
            onAgentClick={(agent) => {
              // 点击客服可以切换对话（如果需要的话）
            }}
          />
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-hidden min-h-0 bg-gradient-to-b from-background to-muted/20">
        <MessageList
          key={`messages-${conversationId}`}
          messages={messages}
          loading={loadingMessages}
          highlightKeyword=""
          onHighlightClear={noopHighlight}
          currentUserIsAgent={false}
          disableAutoScroll={false}
          conversationId={conversationId}
          onMarkMessagesRead={handleMarkAgentMessagesRead}
          bottomSlot={
            chatMode === "ai" && aiTyping ? (
              <div className="flex justify-start mt-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl rounded-bl-none bg-card border border-border/50 shadow-sm text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>AI 正在思考...</span>
                </div>
              </div>
            ) : null
          }
        />
      </div>

      {/* 消息输入框 */}
      <div className="border-t border-border/50 bg-background rounded-b-2xl">
        <MessageInput
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          sending={sending}
          conversationId={conversationId ?? undefined}
        />
      </div>
    </Card>
  );
}

