"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { MessageList } from "@/components/dashboard/MessageList";
import { MessageInput } from "@/components/dashboard/MessageInput";
import { ChatHeader } from "@/components/dashboard/ChatHeader";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { useWebSocket } from "@/features/agent/hooks/useWebSocket";
import {
  fetchMessages,
  sendMessage as sendMessageApi,
  markMessagesRead,
} from "@/features/agent/services/messageApi";
import { fetchConversationDetail } from "@/features/agent/services/conversationApi";
import {
  ConversationDetail,
  ConversationSummary,
  MessageItem,
  MessagesReadPayload,
  ChatWebSocketPayload,
} from "@/features/agent/types";
import type { WSMessage } from "@/lib/websocket";

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();

  const { agent, loading: authLoading } = useAuth();

  const conversationId = useMemo(() => {
    const id = params?.conversationId;
    if (!id) {
      return null;
    }
    const parsed = Number.parseInt(String(id), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params]);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [conversationDetail, setConversationDetail] =
    useState<ConversationDetail | null>(null);
  const [conversationSummary, setConversationSummary] =
    useState<ConversationSummary | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [highlightKeyword, setHighlightKeyword] = useState("");

  const handleMarkMessagesRead = useCallback(
    async (
      conversationIdParam?: number,
      readerIsAgentParam?: boolean
    ) => {
      const targetConversationId = conversationIdParam ?? conversationId;
      const targetReaderIsAgent = readerIsAgentParam ?? true;
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
      if (targetReaderIsAgent) {
        setConversationDetail((prev) =>
          prev ? { ...prev, unread_count: result.unread_count } : prev
        );
        setConversationSummary((prev) =>
          prev ? { ...prev, unread_count: result.unread_count } : prev
        );
      } else {
        setConversationDetail((prev) =>
          prev
            ? {
                ...prev,
                last_seen_at: result.read_at ?? prev.last_seen_at ?? null,
              }
            : prev
        );
      }
    },
    [conversationId]
  );

  const loadConversationDetail = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    const detail = await fetchConversationDetail(conversationId);
    if (detail) {
      setConversationDetail(detail);
      setConversationSummary({
        id: detail.id,
        visitor_id: detail.visitor_id,
        agent_id: detail.agent_id,
        status: detail.status,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
        last_message: detail.last_message,
        unread_count: detail.unread_count ?? 0,
      });
    }
  }, [conversationId]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    setLoadingMessages(true);
    try {
      const data = await fetchMessages(conversationId);
      setMessages(data);
      // 注意：不再自动标记访客消息为已读，而是通过滚动检测来处理
    } catch (error) {
      console.error("拉取消息失败:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      router.push("/agent/dashboard");
    }
  }, [conversationId, router]);

  useEffect(() => {
    if (!conversationId || !agent) {
      return;
    }
    loadConversationDetail();
    loadMessages();
  }, [conversationId, agent, loadConversationDetail, loadMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!conversationId || !agent?.id || !messageInput.trim() || sending) {
      return;
    }
    setSending(true);
    try {
      await sendMessageApi({
        conversationId,
        content: messageInput,
        senderId: agent.id,
      });
      setMessageInput("");
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setSending(false);
    }
  }, [agent?.id, conversationId, messageInput, sending]);

  const handleNewMessage = useCallback(
    (message: MessageItem) => {
      setMessages((prev) => {
        const exists = prev.some((item) => item.id === message.id);
        if (exists) {
          return prev;
        }
        return [...prev, message];
      });

      setConversationDetail((prev) => {
        if (!prev) {
          return prev;
        }
        const nextUnread =
          !message.sender_is_agent && message.message_type !== "system_message"
            ? (prev.unread_count ?? 0) + 1
            : prev.unread_count ?? 0;
        return {
          ...prev,
          updated_at: message.created_at,
          unread_count:
            message.sender_is_agent || message.message_type === "system_message"
              ? prev.unread_count ?? 0
              : nextUnread,
          last_message: {
            id: message.id,
            content: message.content,
            sender_is_agent: message.sender_is_agent,
            message_type: message.message_type ?? "user_message",
            is_read: Boolean(message.is_read),
            read_at: message.read_at ?? null,
            created_at: message.created_at,
          },
        };
      });

      setConversationSummary((prev) => {
        if (!prev) {
          return prev;
        }
        const nextUnread =
          !message.sender_is_agent && message.message_type !== "system_message"
            ? (prev.unread_count ?? 0) + 1
            : prev.unread_count ?? 0;
        return {
          ...prev,
          updated_at: message.created_at,
          unread_count:
            message.sender_is_agent || message.message_type === "system_message"
              ? prev.unread_count ?? 0
              : nextUnread,
          last_message: {
            id: message.id,
            content: message.content,
            sender_is_agent: message.sender_is_agent,
            message_type: message.message_type ?? "user_message",
            is_read: Boolean(message.is_read),
            read_at: message.read_at ?? null,
            created_at: message.created_at,
          },
        };
      });

      // 注意：不再自动标记访客消息为已读，而是通过滚动检测来处理

      if (message.conversation_id === conversationId) {
        loadConversationDetail();
      }
    },
    [conversationId, loadConversationDetail]
  );

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
      const ids = Array.isArray(payload?.message_ids)
        ? payload.message_ids
        : [];
      if (ids.length === 0) {
        return;
      }
      const readAt = payload?.read_at;
      const readerIsAgent = Boolean(payload?.reader_is_agent);
      const unreadCount =
        typeof payload?.unread_count === "number"
          ? payload.unread_count
          : undefined;

      // 对于客服端：只有当 reader_is_agent === false 时（访客读取了客服的消息），
      // 才更新客服消息（sender_is_agent === true）的已读状态
      if (readerIsAgent) {
        // 客服读取了访客的消息，更新未读数（不更新消息的已读状态，因为这是客服读取的）
        if (unreadCount !== undefined) {
          setConversationDetail((prev) =>
            prev ? { ...prev, unread_count: unreadCount } : prev
          );
          setConversationSummary((prev) =>
            prev ? { ...prev, unread_count: unreadCount } : prev
          );
        }
        return;
      }

      // 访客读取了客服的消息，更新客服消息的已读状态
      const messageIdSet = new Set(ids);
      setMessages((prev) =>
        prev.map((msg) =>
          // 只更新客服自己的消息（sender_is_agent === true）的已读状态
          messageIdSet.has(msg.id) && msg.sender_is_agent
            ? {
                ...msg,
                is_read: true,
                read_at: readAt ?? msg.read_at ?? null,
              }
            : msg
        )
      );

      // 更新访客的最后活跃时间
      setConversationDetail((prev) =>
        prev
          ? { ...prev, last_seen_at: readAt ?? prev.last_seen_at ?? null }
          : prev
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
        const data = event.data as MessageItem;
        if (typeof data.conversation_id === "number") {
          handleNewMessage(data);
        }
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
    onMessage: handleWebSocketMessage,
    onError: (error) => console.error("WebSocket 连接错误:", error),
    onClose: () => console.log("WebSocket 连接已关闭"),
  });

  const handleBack = useCallback(() => {
    router.push("/agent/dashboard");
  }, [router]);

  const unreadCount =
    conversationDetail?.unread_count ?? conversationSummary?.unread_count ?? 0;

  if (authLoading || !agent) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-600">
        加载中...
      </div>
    );
  }

  if (!conversationId) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 px-4 h-16">
          <button
            onClick={handleBack}
            className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ← 返回
          </button>
          <div className="flex-1">
            <ChatHeader
              conversationId={conversationId}
              lastSeenAt={conversationDetail?.last_seen_at}
              unreadCount={unreadCount}
              onMarkAllRead={() => handleMarkMessagesRead(conversationId, true)}
              onRefresh={() => {
                loadMessages();
                loadConversationDetail();
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <MessageList
          messages={messages}
          loading={loadingMessages}
          highlightKeyword={highlightKeyword}
          onHighlightClear={() => setHighlightKeyword("")}
          currentUserIsAgent={true}
          conversationId={conversationId}
          onMarkMessagesRead={handleMarkMessagesRead}
        />
        <MessageInput
          value={messageInput}
          onChange={setMessageInput}
          onSubmit={handleSendMessage}
          sending={sending}
        />
      </div>
    </div>
  );
}

