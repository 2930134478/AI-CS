"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchConversationDetail,
  updateConversationContact,
  UpdateConversationContactPayload,
  UpdateConversationContactResult,
} from "../../agent/services/conversationApi";
import {
  fetchMessages,
  markMessagesRead,
  sendMessage,
} from "../../agent/services/messageApi";
import {
  ConversationDetail,
  ConversationSummary,
  MessageItem,
  MessagesReadPayload,
  ChatWebSocketPayload,
  VisitorStatusUpdatePayload,
} from "../../agent/types";
import { useWebSocket } from "./useWebSocket";
import { WSMessage } from "@/lib/websocket";
import { buildMessagePreview } from "@/utils/format";

interface UseMessagesOptions {
  conversationId: number | null;
  agentId: number | null;
  updateConversation: (
    conversationId: number,
    updater: (conversation: ConversationSummary) => ConversationSummary,
    options?: { skipResort?: boolean }
  ) => void;
}

export function useMessages({
  conversationId,
  agentId,
  updateConversation,
}: UseMessagesOptions) {
  // 消息列表、请求状态、访客详情等基础状态
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationDetail, setConversationDetail] =
    useState<ConversationDetail | null>(null);

  const refreshConversationDetail = useCallback(
    async (id: number) => {
      const detail = await fetchConversationDetail(id);
      setConversationDetail(detail);
      // 同时更新对话列表中的 last_seen_at（用于判断在线状态）
      if (detail) {
        updateConversation(id, (conv) => ({
          ...conv,
          last_seen_at: detail.last_seen_at ?? conv.last_seen_at ?? null,
        }));
      }
    },
    [updateConversation]
  );

  const updateContactInfo = useCallback(
    async (
      payload: UpdateConversationContactPayload
    ): Promise<UpdateConversationContactResult> => {
      if (!conversationId) {
        throw new Error("未选中会话，无法更新访客信息");
      }
      const result = await updateConversationContact(conversationId, payload);
      setConversationDetail((prev) =>
        prev
          ? {
              ...prev,
              email: result.email,
              phone: result.phone,
              notes: result.notes,
            }
          : prev
      );
      if (!conversationDetail) {
        refreshConversationDetail(conversationId);
      }
      return result;
    },
    [conversationDetail, conversationId, refreshConversationDetail]
  );

  const handleMarkMessagesRead = useCallback(
    async (id: number, readerIsAgent: boolean) => {
      const result = await markMessagesRead(id, readerIsAgent);
      if (!result || result.message_ids.length === 0) {
        return;
      }

      const messageIdSet = new Set(result.message_ids);
      setMessages((prev) =>
        prev.map((msg) =>
          messageIdSet.has(msg.id)
            ? {
                ...msg,
                is_read: true,
                read_at: result.read_at ?? msg.read_at ?? null,
              }
            : msg
        )
      );

      if (readerIsAgent) {
        updateConversation(id, (conversation) => ({
          ...conversation,
          unread_count: result.unread_count,
          last_message:
            conversation.last_message &&
            messageIdSet.has(conversation.last_message.id)
              ? {
                  ...conversation.last_message,
                  is_read: true,
                  read_at:
                    result.read_at ?? conversation.last_message.read_at ?? null,
                }
              : conversation.last_message,
        }));
        setConversationDetail((prev) =>
          prev ? { ...prev, unread_count: result.unread_count } : prev
        );
      } else {
        updateConversation(
          id,
          (conversation) => ({
            ...conversation,
            last_message:
              conversation.last_message &&
              messageIdSet.has(conversation.last_message.id)
                ? {
                    ...conversation.last_message,
                    is_read: true,
                    read_at:
                      result.read_at ??
                      conversation.last_message.read_at ??
                      null,
                  }
                : conversation.last_message,
          }),
          { skipResort: true }
        );
        setConversationDetail((prev) =>
          prev ? { ...prev, last_seen_at: result.read_at ?? prev.last_seen_at ?? null } : prev
        );
      }
    },
    [updateConversation]
  );

  const loadMessages = useCallback(
    async (id: number) => {
      setLoadingMessages(true);
      try {
        const data = await fetchMessages(id);
        setMessages(data);
        // 注意：不再自动标记访客消息为已读，而是通过滚动检测来处理
      } catch (error) {
        console.error("拉取消息失败:", error);
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!conversationId || !agentId) {
      setMessages([]);
      setConversationDetail(null);
      return;
    }
    loadMessages(conversationId);
    refreshConversationDetail(conversationId);
  }, [conversationId, agentId, loadMessages, refreshConversationDetail]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !agentId || !content.trim() || sending) {
        return;
      }
      setSending(true);
      try {
        await sendMessage({
          conversationId,
          content,
          senderId: agentId,
        });
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [agentId, conversationId, sending]
  );

  const handleNewMessage = useCallback(
    (message: MessageItem) => {
      setMessages((prev) => {
        const exists = prev.some((item) => item.id === message.id);
        if (exists) {
          // 消息已存在，更新消息内容（包括已读状态）
          return prev.map((msg) =>
            msg.id === message.id
              ? {
                  ...msg,
                  ...message,
                  // 如果消息已被标记为已读，保持已读状态
                  is_read: message.is_read ?? msg.is_read,
                  read_at: message.read_at ?? msg.read_at,
                }
              : msg
          );
        }
        return [...prev, message];
      });

      updateConversation(message.conversation_id, (conversation) => {
        const preview = buildMessagePreview(message.content);
        const isSystemMessage =
          (message.message_type ?? "user_message") === "system_message";
        const isVisitorMessage = !message.sender_is_agent && !isSystemMessage;
        const isCurrentConversation = message.conversation_id === conversationId;
        const nextUnread = isVisitorMessage
          ? isCurrentConversation
            ? 0
            : (conversation.unread_count ?? 0) + 1
          : conversation.unread_count ?? 0;

        return {
          ...conversation,
          updated_at: message.created_at,
          unread_count: nextUnread,
          last_message: {
            id: message.id,
            content: preview,
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
        refreshConversationDetail(message.conversation_id);
      }
    },
    [conversationId, refreshConversationDetail, updateConversation]
  );

  const handleMessagesReadBroadcast = useCallback(
    (payload: MessagesReadPayload, eventConversationId?: number) => {
      const messageIds: number[] = Array.isArray(payload?.message_ids)
        ? payload.message_ids
        : [];
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return;
      }
      const readAt: string | undefined = payload?.read_at;
      const readerIsAgent: boolean = Boolean(payload?.reader_is_agent);
      const conversation_id: number | undefined =
        payload?.conversation_id ?? eventConversationId;
      if (!conversation_id) {
        return;
      }

      // 对于客服端：只有当 reader_is_agent === false 时（访客读取了客服的消息），
      // 才更新客服消息（sender_is_agent === true）的已读状态
      if (readerIsAgent) {
        return;
      }

      const idSet = new Set(messageIds);
      // 更新消息列表中的已读状态（只更新当前对话中的消息，且只更新客服自己的消息）
      if (conversation_id === conversationId) {
        setMessages((prev) => {
          // 检查是否有需要更新的消息
          const hasUpdates = prev.some(
            (msg) => idSet.has(msg.id) && msg.sender_is_agent && !msg.is_read
          );
          if (!hasUpdates) {
            // 没有需要更新的消息，直接返回原列表
            return prev;
          }
          // 更新消息列表
          return prev.map((msg) =>
            // 只更新客服自己的消息（sender_is_agent === true）的已读状态
            idSet.has(msg.id) && msg.sender_is_agent
              ? {
                  ...msg,
                  is_read: true,
                  read_at: readAt ?? msg.read_at ?? null,
                }
              : msg
          );
        });
      }

      const unreadCount =
        typeof payload?.unread_count === "number"
          ? payload.unread_count
          : undefined;

      updateConversation(conversation_id, (conversation) => {
        const lastMessage =
          conversation.last_message &&
          idSet.has(conversation.last_message.id)
            ? {
                ...conversation.last_message,
                is_read: true,
                read_at:
                  readAt ?? conversation.last_message.read_at ?? null,
              }
            : conversation.last_message;

        return {
          ...conversation,
          last_message: lastMessage,
          unread_count:
            readerIsAgent && unreadCount !== undefined
              ? unreadCount
              : conversation.unread_count,
        };
      });

      if (conversation_id === conversationId) {
        setConversationDetail((prev) => {
          if (!prev) {
            return prev;
          }
          if (readerIsAgent && unreadCount !== undefined) {
            return { ...prev, unread_count: unreadCount };
          }
          if (!readerIsAgent) {
            return {
              ...prev,
              last_seen_at: readAt ?? prev.last_seen_at ?? null,
            };
          }
          return prev;
        });
      }
    },
    [conversationId, updateConversation]
  );

  const onWebSocketMessage = useCallback(
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
        handleMessagesReadBroadcast(
          event.data as MessagesReadPayload,
          event.conversation_id
        );
      } else if (event.type === "visitor_status_update") {
        // 处理访客状态更新事件
        const payload = event.data as VisitorStatusUpdatePayload;
        if (payload?.conversation_id) {
          if (payload.is_online === true) {
            // 在线：更新为当前时间（实时更新在线状态）
            updateConversation(payload.conversation_id, (conv) => ({
              ...conv,
              last_seen_at: new Date().toISOString(),
            }));
          }
          // 刷新对话详情以获取最新的 last_seen_at（后端会在离线时更新 last_seen_at）
          // refreshConversationDetail 会自动更新对话列表的 last_seen_at
          refreshConversationDetail(payload.conversation_id);
        }
      }
    },
    [
      conversationId,
      handleMessagesReadBroadcast,
      handleNewMessage,
      refreshConversationDetail,
      updateConversation,
    ]
  );

  useWebSocket<ChatWebSocketPayload>({
    conversationId,
    enabled: Boolean(conversationId),
    isVisitor: false, // 客服端设置为 false
    onMessage: onWebSocketMessage,
    onError: (error) => console.error("WebSocket 连接错误:", error),
    onClose: () => console.log("WebSocket 连接已关闭"),
  });

  const controls = useMemo(
    () => ({
      messages,
      loadingMessages,
      sending,
      conversationDetail,
      refreshConversationDetail,
      refreshMessages: loadMessages,
      sendMessage: handleSendMessage,
      markMessagesAsRead: handleMarkMessagesRead,
      updateContactInfo,
    }),
    [
      conversationDetail,
      handleMarkMessagesRead,
      handleSendMessage,
      loadMessages,
      loadingMessages,
      messages,
      refreshConversationDetail,
      sending,
      updateContactInfo,
    ]
  );

  return controls;
}

