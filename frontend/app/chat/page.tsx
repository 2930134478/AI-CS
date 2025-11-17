"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MessageList } from "@/components/dashboard/MessageList";
import { MessageInput } from "@/components/dashboard/MessageInput";
import {
  ChatWebSocketPayload,
  MessageItem,
  MessagesReadPayload,
} from "@/features/agent/types";
import {
  fetchMessages,
  markMessagesRead,
  sendMessage,
} from "@/features/agent/services/messageApi";
import { initVisitorConversation } from "@/features/visitor/services/conversationApi";
import { useWebSocket } from "@/features/agent/hooks/useWebSocket";
import type { WSMessage } from "@/lib/websocket";

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

export default function ChatPage() {
  // ===== 访客与会话状态 =====
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string>("open");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");

  const noopHighlight = useCallback(() => {}, []);

  // 初始化访客 ID（使用 localStorage 保持连续性）
  useEffect(() => {
    let stored = window.localStorage.getItem("visitor_id");
    if (!stored) {
      stored = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
      window.localStorage.setItem("visitor_id", stored);
    }
    const parsed = Number.parseInt(stored, 10);
    setVisitorId(Number.isNaN(parsed) ? null : parsed);
  }, []);

  // 创建或恢复访客会话
  const initializeConversation = useCallback(async (id: number) => {
    const { browser, os } = parseUserAgent(navigator.userAgent);
    const language =
      navigator.language || (navigator.languages && navigator.languages[0]) || "";
    const result = await initVisitorConversation({
      visitorId: id,
      website: window.location.href,
      referrer: document.referrer || "",
      browser,
      os,
      language,
    });
    if (result.conversation_id) {
      setConversationId(result.conversation_id);
      setConversationStatus(result.status);
    }
  }, []);

  useEffect(() => {
    if (visitorId === null) {
      return;
    }
    initializeConversation(visitorId).catch((error) =>
      console.error("初始化对话失败:", error)
    );
  }, [initializeConversation, visitorId]);

  // 标记客服消息已读（readerIsAgent = false 表示访客读取了客服的消息）
  const handleMarkAgentMessagesRead = useCallback(
    async (conversationIdParam?: number, readerIsAgentParam?: boolean) => {
      const targetConversationId = conversationIdParam ?? conversationId;
      const targetReaderIsAgent = readerIsAgentParam ?? false;
      if (!targetConversationId) {
        return;
      }
      const result = await markMessagesRead(targetConversationId, targetReaderIsAgent);
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

  // 拉取历史消息
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    setLoadingMessages(true);
    try {
      const data = await fetchMessages(conversationId);
      setMessages(data);
      // 注意：不再自动标记客服消息为已读，而是通过滚动检测来处理
    } catch (error) {
      console.error("拉取消息失败:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 收到新消息时更新状态（包括访客消息和客服消息）
  const handleNewMessage = useCallback(
    (message: MessageItem) => {
      if (!conversationId || message.conversation_id !== conversationId) {
        return;
      }
      setMessages((prev) => {
        const exists = prev.some((item) => item.id === message.id);
        if (exists) {
          return prev;
        }
        return [...prev, message];
      });
      // 注意：不再自动标记客服消息为已读，而是通过滚动检测来处理
    },
    [conversationId]
  );

  // 处理 WebSocket 的已读事件
  // 只有当客服读取了访客的消息时（reader_is_agent === true），才更新访客消息的已读状态
  const handleMessagesReadEvent = useCallback(
    (payload: MessagesReadPayload) => {
      if (!conversationId) {
        return;
      }
      // 检查对话ID是否匹配
      const payloadConversationId = payload?.conversation_id;
      if (payloadConversationId && payloadConversationId !== conversationId) {
        return;
      }
      // 只有当 reader_is_agent === true 时，才表示客服读取了访客的消息
      // 此时应该更新访客消息（sender_is_agent === false）的已读状态
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
          // 只更新访客自己的消息（sender_is_agent === false）的已读状态
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
        handleNewMessage(event.data as MessageItem);
      } else if (event.type === "messages_read") {
        // 确保处理已读事件，并传入对话ID
        const payload = event.data as MessagesReadPayload;
        if (!payload.conversation_id && event.conversation_id) {
          payload.conversation_id = event.conversation_id;
        }
        handleMessagesReadEvent(payload);
      }
    },
    [handleMessagesReadEvent, handleNewMessage]
  );

  useWebSocket<ChatWebSocketPayload>({
    conversationId,
    enabled: Boolean(conversationId),
    isVisitor: true, // 访客端明确设置为 true
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error("WebSocket 连接错误（访客端）:", error);
    },
  });

  const handleSendMessage = useCallback(async () => {
    if (!conversationId || !input.trim() || sending) {
      return;
    }
    const messageContent = input.trim();
    setSending(true);
    try {
      await sendMessage({
        conversationId,
        content: messageContent,
        senderIsAgent: false,
      });
      setInput("");
    } catch (error) {
      console.error("❌ 发送消息失败:", error);
      alert((error as Error).message || "发送消息失败，请稍后重试");
    } finally {
      setSending(false);
    }
  }, [conversationId, input, sending]);

  const headerStatus = useMemo(() => {
    if (!conversationId) {
      return "正在建立会话...";
    }
    return `会话 #${conversationId} · ${
      conversationStatus === "open" ? "进行中" : "已关闭"
    }`;
  }, [conversationId, conversationStatus]);

  if (visitorId === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">
        正在初始化对话...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">访客聊天</h1>
        <div className="text-sm opacity-90 mt-1">{headerStatus}</div>
      </div>
      <MessageList
        messages={messages}
        loading={loadingMessages}
        highlightKeyword=""
        onHighlightClear={noopHighlight}
        currentUserIsAgent={false}
        disableAutoScroll
        conversationId={conversationId}
        onMarkMessagesRead={handleMarkAgentMessagesRead}
      />
      <MessageInput
        value={input}
        onChange={setInput}
        onSubmit={handleSendMessage}
        sending={sending}
      />
    </div>
  );
}

