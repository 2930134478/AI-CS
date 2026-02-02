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
import { playNotificationSound } from "@/utils/sound";

interface UseMessagesOptions {
  conversationId: number | null;
  agentId: number | null;
  updateConversation: (
    conversationId: number,
    updater: (conversation: ConversationSummary) => ConversationSummary,
    options?: { skipResort?: boolean }
  ) => void;
  refreshConversations?: () => void;
  hasConversation?: (conversationId: number) => boolean;
  soundEnabled?: boolean;
  /** 内部对话（知识库测试）时强制包含 AI 消息 */
  forceIncludeAIMessages?: boolean;
}

export function useMessages({
  conversationId,
  agentId,
  updateConversation,
  refreshConversations,
  hasConversation,
  soundEnabled = false,
  forceIncludeAIMessages = false,
}: UseMessagesOptions) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationDetail, setConversationDetail] =
    useState<ConversationDetail | null>(null);
  const [includeAIMessages, setIncludeAIMessages] = useState(forceIncludeAIMessages);
  /** 内部对话（知识库测试）下发消息后等待 AI 回复时显示「正在思考」（与访客小窗逻辑一致） */
  const [aiThinking, setAiThinking] = useState(false);

  const refreshConversationDetail = useCallback(
    async (id: number) => {
      const detail = await fetchConversationDetail(id, agentId ?? undefined);
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

  const effectiveIncludeAIMessages = forceIncludeAIMessages || includeAIMessages;
  const loadMessages = useCallback(
    async (id: number, includeAI?: boolean) => {
      const include = includeAI ?? effectiveIncludeAIMessages;
      setLoadingMessages(true);
      try {
        const data = await fetchMessages(id, include);
        setMessages(data);
      } catch (error) {
        console.error("拉取消息失败:", error);
      } finally {
        setLoadingMessages(false);
      }
    },
    [effectiveIncludeAIMessages]
  );

  useEffect(() => {
    if (!conversationId || !agentId) {
      setMessages([]);
      setConversationDetail(null);
      return;
    }
    loadMessages(conversationId, effectiveIncludeAIMessages);
    refreshConversationDetail(conversationId);
  }, [conversationId, agentId, effectiveIncludeAIMessages, loadMessages, refreshConversationDetail]);

  const handleSendMessage = useCallback(
    async (content: string, fileInfo?: { file_url: string; file_type: string; file_name: string; file_size: number; mime_type: string }) => {
      if (!conversationId || !agentId || sending) {
        return;
      }
      // 验证：必须有内容或文件
      if (!content.trim() && !fileInfo) {
        return;
      }
      setSending(true);
      if (forceIncludeAIMessages) {
        setAiThinking(true);
      }
      try {
        await sendMessage({
          conversationId,
          content: content.trim(),
          senderId: agentId,
          fileUrl: fileInfo?.file_url,
          fileType: fileInfo?.file_type as "image" | "document" | undefined,
          fileName: fileInfo?.file_name,
          fileSize: fileInfo?.file_size,
          mimeType: fileInfo?.mime_type,
        });
      } catch (error) {
        console.error(error);
        if (forceIncludeAIMessages) {
          setAiThinking(false);
        }
        throw error;
      } finally {
        setSending(false);
      }
    },
    [agentId, conversationId, sending, forceIncludeAIMessages]
  );

  const handleNewMessage = useCallback(
    (message: MessageItem) => {
      // 如果是访客发送的消息（不是客服自己发送的），播放提示音
      if (!message.sender_is_agent && soundEnabled) {
        playNotificationSound();
      }
      
      // 检查对话是否存在
      const conversationExists = hasConversation
        ? hasConversation(message.conversation_id)
        : true; // 如果没有提供检查方法，假设对话存在

      // 先更新对话列表（无论是否是当前对话，都需要更新未读数、最后消息等）
      // 这样即使客服没有选中这个对话，也能看到新消息的提示
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

      // 如果对话不存在（新对话），延迟刷新对话列表以添加新对话
      // 使用 setTimeout 延迟刷新，避免频繁刷新，并且给 updateConversation 时间完成
      if (!conversationExists && refreshConversations) {
        setTimeout(() => {
          refreshConversations();
        }, 500);
      }

      // 只处理当前对话的消息（添加到消息列表）
      if (message.conversation_id !== conversationId) {
        return;
      }

      // 根据 includeAIMessages 状态过滤 AI 消息
      // 如果隐藏 AI 消息（includeAIMessages === false）且消息的 chat_mode === "ai"，则不添加到消息列表
      const messageChatMode = message.chat_mode || "human"; // 兼容历史数据，默认为 human
      const shouldHideAIMessage = !effectiveIncludeAIMessages && messageChatMode === "ai";

      setMessages((prev) => {
        const exists = prev.some((item) => item.id === message.id);
        if (exists) {
          // 消息已存在，需要根据 effectiveIncludeAIMessages 决定是否保留
          if (shouldHideAIMessage) {
            // 如果应该隐藏 AI 消息，则从列表中移除
            return prev.filter((msg) => msg.id !== message.id);
          }
          // 消息已存在，更新消息内容（包括已读状态）
          return prev.map((msg) =>
            msg.id === message.id
              ? {
                  ...msg,
                  ...message,
                  // 如果消息已被标记为已读，保持已读状态；否则保持原状态
                  // 这样可以避免丢失已读状态
                  is_read: message.is_read ?? msg.is_read ?? false,
                  read_at: message.read_at ?? msg.read_at ?? null,
                }
              : msg
          );
        }
        // 新消息：如果要隐藏 AI 消息且这是 AI 消息，则不添加
        if (shouldHideAIMessage) {
          return prev;
        }
        // 新消息：添加到列表末尾
        return [...prev, message];
      });

      // 内部对话（知识库测试）：收到 AI 回复时关闭「正在思考」（与访客小窗一致：收到对方回复即关闭）
      if (forceIncludeAIMessages && message.conversation_id === conversationId) {
        const msgChatMode = message.chat_mode || "human";
        if (msgChatMode === "ai") {
          setAiThinking(false);
        }
      }

      // 注意：不再自动标记访客消息为已读，而是通过滚动检测来处理
      // 不再调用 refreshConversationDetail，避免不必要的重新加载和状态丢失
    },
    [conversationId, updateConversation, refreshConversations, hasConversation, effectiveIncludeAIMessages, soundEnabled, forceIncludeAIMessages]
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
            // 如果当前正在查看这个对话，也更新对话详情
            if (payload.conversation_id === conversationId) {
              setConversationDetail((prev) =>
                prev
                  ? {
                      ...prev,
                      last_seen_at: new Date().toISOString(),
                    }
                  : prev
              );
            }
          } else {
            // 离线：刷新对话详情以获取最新的 last_seen_at（后端会在离线时更新 last_seen_at）
            // refreshConversationDetail 会自动更新对话列表的 last_seen_at
            refreshConversationDetail(payload.conversation_id);
          }
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
    agentId: agentId ?? undefined, // 传递客服ID，用于创建系统消息
    onMessage: onWebSocketMessage,
    onError: (error) => {
      // 静默处理错误，避免影响用户体验
    },
    onClose: () => {
      // 静默处理关闭，避免影响用户体验
    },
  });

  // 切换 AI 消息显示/隐藏
  const toggleAIMessages = useCallback(async () => {
    const newValue = !includeAIMessages;
    setIncludeAIMessages(newValue);
    // 如果当前有选中的对话，重新加载消息（从服务器获取完整消息列表，确保过滤正确）
    if (conversationId) {
      await loadMessages(conversationId, newValue);
    }
  }, [includeAIMessages, conversationId, loadMessages]);

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
      includeAIMessages: effectiveIncludeAIMessages,
      toggleAIMessages,
      forceIncludeAIMessages,
      aiThinking,
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
      effectiveIncludeAIMessages,
      toggleAIMessages,
      forceIncludeAIMessages,
      aiThinking,
    ]
  );

  return controls;
}

