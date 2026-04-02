"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageList } from "@/components/dashboard/MessageList";
import { OnlineAgentsList, type OnlineAgent } from "./OnlineAgentsList";
import { VisitorMessageInput } from "./VisitorMessageInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { websiteConfig } from "@/lib/website-config";
import {
  ChatWebSocketPayload,
  MessageItem,
  MessagesReadPayload,
  TypingDraftPayload,
} from "@/features/agent/types";
import {
  fetchMessages,
  markMessagesRead,
  sendMessage,
  UploadFileResult,
} from "@/features/agent/services/messageApi";
import { initVisitorConversation } from "@/features/visitor/services/conversationApi";
import { postWidgetOpen } from "@/features/visitor/services/analyticsApi";
import { fetchOnlineAgents } from "@/features/visitor/services/visitorApi";
import {
  fetchPublicAIModels,
  type AIConfig,
} from "@/features/agent/services/aiConfigApi";
import {
  fetchVisitorWidgetConfig,
  type VisitorWidgetConfig,
} from "@/features/agent/services/embeddingConfigApi";
import { TYPING_DRAFT_TTL_MS } from "@/lib/constants/typing-draft";
import { useWebSocket } from "@/features/agent/hooks/useWebSocket";
import type { WSMessage } from "@/lib/websocket";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { playNotificationSound } from "@/utils/sound";
import { getAvatarUrl } from "@/utils/avatar";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2 } from "lucide-react";

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

/** 与顶栏（Header h-16 / md:h-20 + 间距）、底栏（bottom-20 / sm:bottom-24）对齐，矮视口下限制高度 */
const CHAT_WIDGET_PANEL_MAX_H =
  "max-h-[min(680px,calc(100dvh-5rem-4.5rem-env(safe-area-inset-top,0px)))] sm:max-h-[min(680px,calc(100dvh-6rem-4.5rem-env(safe-area-inset-top,0px)))] md:max-h-[min(680px,calc(100dvh-6rem-5.5rem-env(safe-area-inset-top,0px)))]";
const CHAT_WIDGET_PANEL_H =
  "h-[min(540px,calc(100dvh-5rem-4.5rem-env(safe-area-inset-top,0px)))] sm:h-[min(620px,calc(100dvh-6rem-4.5rem-env(safe-area-inset-top,0px)))] md:h-[min(680px,calc(100dvh-6rem-5.5rem-env(safe-area-inset-top,0px)))]";

/** 视口偏矮时略收窄，避免「又矮又宽」的观感；大屏高度充足时仍为 420px */
const CHAT_WIDGET_PANEL_WIDTH =
  "w-[min(420px,calc(100vw-1.5rem))] [@media(max-height:780px)]:w-[min(372px,calc(100vw-1.5rem))] [@media(max-height:680px)]:w-[min(340px,calc(100vw-1.5rem))]";
const CHAT_WIDGET_PANEL_MAX_W =
  "max-w-[420px] [@media(max-height:780px)]:max-w-[372px] [@media(max-height:680px)]:max-w-[340px]";

/**
 * 聊天小窗组件
 * 提供小窗形式的聊天界面，支持展开/收起
 */
export function ChatWidget({ visitorId, isOpen, onToggle }: ChatWidgetProps) {
  const WEB_SEARCH_PREF_KEY = "visitor_widget_need_web_search";
  // 数据分析：每次由关→开上报一次小窗打开（供后台「小窗打开次数」统计）
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }
    if (!prevIsOpenRef.current && visitorId != null && visitorId > 0) {
      void postWidgetOpen(visitorId);
    }
    prevIsOpenRef.current = true;
  }, [isOpen, visitorId]);

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
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const [aiModels, setAiModels] = useState<AIConfig[]>([]);
  const [onlineAgents, setOnlineAgents] = useState<OnlineAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  /** AI 模式下发消息后等待回复时显示「正在输入」提示 */
  const [aiTyping, setAiTyping] = useState(false);
  const [agentTypingDraft, setAgentTypingDraft] = useState("");
  const [agentTypingSenderId, setAgentTypingSenderId] = useState<number | null>(null);
  /** 联网搜索：本回合是否使用联网（访客可勾选） */
  const [needWebSearch, setNeedWebSearch] = useState(false);
  /** 访客小窗配置（由配置页控制是否显示联网设置） */
  const [widgetConfig, setWidgetConfig] = useState<VisitorWidgetConfig | null>(null);
  const typingSeqRef = useRef(0);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 声音通知开关（访客端）
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundNotification(true);

  const noopHighlight = useCallback(() => {}, []);
  const shouldHideForVisitor = useCallback((msg: MessageItem) => {
    if ((msg.message_type ?? "") !== "system_message") return false;
    const content = (msg.content || "").trim().toLowerCase();
    // 访客侧隐藏来源/落地页埋点系统消息，仅客服端查看即可
    return (
      content.startsWith("visitor opened the page") ||
      content.startsWith("visitor came from")
    );
  }, []);
  const isMessageInCurrentMode = useCallback(
    (msg: MessageItem) => {
      const mode = (msg.chat_mode || "human").toLowerCase();
      return mode === chatMode;
    },
    [chatMode]
  );
  const selectedAIModel = useMemo(
    () => aiModels.find((m) => m.id === selectedAIConfigId) ?? null,
    [aiModels, selectedAIConfigId]
  );
  const agentAvatarMap = useMemo<Record<number, string>>(
    () =>
      Object.fromEntries(
        onlineAgents
          .filter((a) => a.id > 0 && Boolean(a.avatar_url))
          .map((a) => [a.id, a.avatar_url])
      ),
    [onlineAgents]
  );

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!modelMenuRef.current) return;
      if (!modelMenuRef.current.contains(event.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  // 当小窗打开时，拉取访客小窗配置（联网设置是否显示及来源）
  useEffect(() => {
    if (isOpen) {
      fetchVisitorWidgetConfig()
        .then(setWidgetConfig)
        .catch(() => setWidgetConfig(null));
    }
  }, [isOpen]);

  // 记住「联网搜索」开关状态（仅浏览器端）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(WEB_SEARCH_PREF_KEY);
    if (saved === "true") setNeedWebSearch(true);
    if (saved === "false") setNeedWebSearch(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WEB_SEARCH_PREF_KEY, String(needWebSearch));
  }, [needWebSearch]);

  // 加载开放的 AI 模型列表（文本 + 生图），统一作为 AI 客服下的渠道
  useEffect(() => {
    async function loadModels() {
      try {
        const [textModels, imgModels] = await Promise.all([
          fetchPublicAIModels("text"),
          fetchPublicAIModels("image"),
        ]);
        const all = [...textModels, ...imgModels];
        setAiModels(all);
        if (all.length > 0) {
          setSelectedAIConfigId(all[0].id);
        }
      } catch (error) {
        console.error("加载 AI/生图模型列表失败:", error);
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
      if (mode === "ai") {
        if (aiModels.length === 0) {
          alert("暂无可用的 AI 模型，请在后台「设置」-「AI 配置」中至少将一个模型设为「开放给访客」后再试。");
          return;
        }
        if (!selectedAIConfigId) {
          alert("请先选择一个 AI 模型");
          return;
        }
      }
      const configId = mode === "ai" ? selectedAIConfigId : undefined;
      initializeConversation(visitorId, mode, configId);
    },
    [visitorId, initializing, selectedAIConfigId, aiModels.length, initializeConversation]
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
      })).filter((msg) => !shouldHideForVisitor(msg) && isMessageInCurrentMode(msg));
      setMessages(normalizedMessages);
    } catch (error) {
      console.error("拉取消息失败:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId, chatMode, shouldHideForVisitor, isMessageInCurrentMode]);

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
      if (shouldHideForVisitor(message)) {
        return;
      }
      if (!isMessageInCurrentMode(message)) {
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
    [conversationId, shouldHideForVisitor, isMessageInCurrentMode]
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
        if (msg.sender_is_agent) {
          setAgentTypingDraft("");
        }
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
      } else if (event.type === "typing_draft" && event.data) {
        const payload = event.data as TypingDraftPayload;
        // 访客侧只展示客服草稿。
        if (!payload.sender_is_agent) {
          return;
        }
        const text = typeof payload.text === "string" ? payload.text : "";
        setAgentTypingDraft(text);
        setAgentTypingSenderId(
          typeof payload.sender_id === "number" ? payload.sender_id : null
        );
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => {
          setAgentTypingDraft("");
          setAgentTypingSenderId(null);
        }, TYPING_DRAFT_TTL_MS);
      } else if (event.type === "typing_stop") {
        const payload = (event.data || {}) as TypingDraftPayload;
        if (!payload.sender_is_agent) {
          return;
        }
        setAgentTypingDraft("");
        setAgentTypingSenderId(null);
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      }
    },
    [handleMessagesReadEvent, handleNewMessage, chatMode]
  );

  const { send: sendWebSocketEvent } = useWebSocket<ChatWebSocketPayload>({
    conversationId,
    enabled: Boolean(conversationId) && isOpen,
    isVisitor: true,
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error("WebSocket 连接错误（访客端）:", error);
    },
  });

  const sendTypingDraft = useCallback(
    (text: string) => {
      if (!conversationId) {
        return;
      }
      const content = text.slice(0, 300);
      if (!content.trim()) {
        sendWebSocketEvent("typing_stop", { sender_is_agent: false });
        return;
      }
      typingSeqRef.current += 1;
      sendWebSocketEvent("typing_draft", {
        sender_is_agent: false,
        text: content,
        seq: typingSeqRef.current,
      });
    },
    [conversationId, sendWebSocketEvent]
  );

  const sendTypingStop = useCallback(() => {
    if (!conversationId) {
      return;
    }
    sendWebSocketEvent("typing_stop", { sender_is_agent: false });
  }, [conversationId, sendWebSocketEvent]);

  useEffect(() => {
    if (!conversationId || !isOpen || chatMode !== "human") {
      return;
    }
    const timer = setTimeout(() => {
      if (input.trim()) {
        sendTypingDraft(input);
      } else {
        sendTypingStop();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [chatMode, conversationId, input, isOpen, sendTypingDraft, sendTypingStop]);

  useEffect(() => {
    if (!isOpen || chatMode !== "human") {
      setAgentTypingDraft("");
      setAgentTypingSenderId(null);
    }
  }, [chatMode, isOpen]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      sendTypingStop();
    };
  }, [sendTypingStop]);

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
      sendTypingStop();
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
          needWebSearch: chatMode === "ai" ? needWebSearch : undefined,
          useWebSearch: chatMode === "ai" && needWebSearch ? true : undefined,
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
    [conversationId, input, sending, visitorId, chatMode, needWebSearch, sendTypingStop, widgetConfig]
  );

  // 如果不打开，不渲染内容
  if (!isOpen) {
    return null;
  }

  // 挂到 body，避免页面内祖先的 transform/filter/backdrop-filter 在 Chrome 等浏览器中
  // 成为 fixed 定位的包含块，导致小窗错位到视口中上部而右下角按钮仍正常。
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Card
      className={cn(
        "fixed bottom-20 right-4 sm:bottom-24 sm:right-6 flex flex-col shadow-[0_24px_60px_-24px_rgba(2,6,23,0.35)] z-40 border border-slate-200 overflow-hidden rounded-2xl bg-white text-slate-900 ring-1 ring-slate-200/80",
        CHAT_WIDGET_PANEL_MAX_W,
        CHAT_WIDGET_PANEL_WIDTH,
        CHAT_WIDGET_PANEL_MAX_H,
        CHAT_WIDGET_PANEL_H
      )}
    >
      {/* 头部：回归品牌蓝色系，保持轻量与一致 */}
      <div className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6] border-b border-blue-300/40 px-4 py-3.5 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
            <svg
              className="w-5 h-5 text-white/90"
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
          <h2 className="text-base font-bold text-white truncate">客服聊天</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* 声音开关按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            className="text-white/90 hover:text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg transition-colors"
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
            className="text-white/90 hover:text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg transition-colors"
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
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        {/* 模式切换按钮 */}
        <div className="flex items-center gap-2 mb-3 justify-center flex-wrap">
          <Button
            variant={chatMode === "human" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeSwitch("human")}
            disabled={initializing}
            className={
              chatMode === "human"
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500 transition-colors border border-blue-600"
                : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300"
            }
          >
            人工客服
          </Button>
          <Button
            variant={chatMode === "ai" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeSwitch("ai")}
            disabled={initializing}
            title={aiModels.length === 0 ? "暂无可用的 AI/绘画模型，请在后台设置中开放" : undefined}
            className={
              chatMode === "ai"
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500 transition-colors border border-blue-600"
                : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300"
            }
          >
            AI 客服
          </Button>
        </div>
        {/* 模型选择已下沉到输入区发送按钮左侧（仅 AI 模式显示） */}
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
      <div className="flex-1 overflow-hidden min-h-0 bg-slate-50">
        <MessageList
          key={`messages-${conversationId}-${chatMode}`}
          messages={messages}
          loading={loadingMessages}
          highlightKeyword=""
          onHighlightClear={noopHighlight}
          currentUserIsAgent={false}
          disableAutoScroll={false}
          conversationId={conversationId}
          onMarkMessagesRead={handleMarkAgentMessagesRead}
          leftAvatarBySenderId={chatMode === "human" ? agentAvatarMap : undefined}
          bottomSlot={
            <>
              {chatMode === "human" && agentTypingDraft ? (
                <div className="flex justify-start mt-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                    {(() => {
                      const draftAvatar =
                        agentTypingSenderId != null
                          ? getAvatarUrl(agentAvatarMap[agentTypingSenderId])
                          : null;
                      return draftAvatar ? (
                        <img
                          src={draftAvatar}
                          alt="客服头像"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">
                          客
                        </div>
                      );
                    })()}
                  </div>
                  <div className="px-3.5 py-2.5 rounded-[18px] rounded-bl-md bg-slate-100/80 border border-solid border-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.04)] text-sm text-slate-500 max-w-[72%] break-words">
                    <span>{agentTypingDraft}</span>
                    <span className="inline-flex items-center ml-1 align-middle">
                      <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-duration:1.2s]" />
                      <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-duration:1.2s] [animation-delay:0.15s] mx-0.5" />
                      <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-duration:1.2s] [animation-delay:0.3s]" />
                    </span>
                  </div>
                </div>
              ) : null}
              {chatMode === "ai" && aiTyping ? (
                <div className="flex justify-start mt-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl rounded-bl-none bg-white border border-slate-200 shadow-sm text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>AI 正在思考...</span>
                  </div>
                </div>
              ) : null}
            </>
          }
        />
      </div>

      {/* 消息输入框 */}
      <div className="border-t border-slate-200 bg-slate-50 rounded-b-2xl px-3 pt-2 pb-2.5">
        <VisitorMessageInput
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          sending={sending}
          conversationId={conversationId ?? undefined}
          toolsSlot={
            chatMode === "ai" && (widgetConfig?.web_search_enabled ?? false) ? (
              <button
                type="button"
                onClick={() => setNeedWebSearch((v) => !v)}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  needWebSearch
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-pressed={needWebSearch}
              >
                联网搜索
              </button>
            ) : null
          }
          submitLeftSlot={
            chatMode === "ai" && aiModels.length > 0 ? (
              <div className="relative" ref={modelMenuRef}>
                <button
                  type="button"
                  onClick={() => setModelMenuOpen((v) => !v)}
                  disabled={initializing || sending}
                  className="h-8 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 text-xs text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors disabled:opacity-50"
                  title="选择模型"
                >
                  {selectedAIModel?.model_type === "image" ? "绘画" : "文本"}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {modelMenuOpen && (
                  <div className="absolute bottom-10 -right-10 z-20 w-[280px] rounded-lg border border-slate-200 bg-white shadow-lg p-1">
                    {aiModels.map((model) => {
                      const active = model.id === selectedAIConfigId;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          className={`w-full px-2.5 py-2 text-left rounded-md flex items-start justify-between gap-2 ${
                            active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                          }`}
                          onClick={() => {
                            setSelectedAIConfigId(model.id);
                            setModelMenuOpen(false);
                            if (visitorId) initializeConversation(visitorId, "ai", model.id);
                          }}
                        >
                          <span className="min-w-0">
                            <div className="text-xs font-medium leading-4">
                              {model.model_type === "image" ? "绘画" : "文本"}
                            </div>
                            <div className="text-[11px] leading-4 text-slate-500 break-all">
                              {model.provider} - {model.model}
                            </div>
                          </span>
                          {active ? <Check className="w-3.5 h-3.5 ml-2 flex-shrink-0" /> : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null
          }
        />
      </div>
    </Card>,
    document.body
  );
}

