"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchConversations,
  searchConversations,
} from "../../agent/services/conversationApi";
import { ConversationSummary, VisitorStatusUpdatePayload } from "../../agent/types";
import { useWebSocket } from "./useWebSocket";
import { WSMessage } from "@/lib/websocket";
import { ChatWebSocketPayload } from "../../agent/types";

const sortByUpdatedAtDesc = (list: ConversationSummary[]) =>
  [...list].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

import type { ConversationFilter } from "@/components/dashboard/ConversationHeader";

interface UseConversationsOptions {
  agentId?: number | null; // 客服ID（用于建立 WebSocket 连接接收全局事件）
  filter?: ConversationFilter; // 会话过滤类型
}

export function useConversations(options?: UseConversationsOptions) {
  const { agentId, filter = "all" } = options || {};
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    ConversationSummary[]
  >([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const searchRef = useRef("");

  // 根据 filter 过滤会话
  const applyFilter = useCallback(
    (conversations: ConversationSummary[]): ConversationSummary[] => {
      if (!agentId) {
        return conversations;
      }

      switch (filter) {
        case "mine":
          // 只显示当前用户参与过的会话（has_participated === true）
          // 即当前用户在该会话中发送过消息的会话
          return conversations.filter((conv) => conv.has_participated === true);
        case "others":
          // 显示除了当前用户参与过的其他人的会话（has_participated !== true）
          return conversations.filter((conv) => conv.has_participated !== true);
        case "all":
        default:
          return conversations;
      }
    },
    [agentId, filter]
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConversations(agentId ?? undefined);
      setConversations(data);
      const filtered = applyFilter(data);
      if (!searchRef.current.trim()) {
        setFilteredConversations(filtered);
      }
      setSelectedConversationId((prev) => {
        if (prev) {
          return prev;
        }
        return filtered.length > 0 ? filtered[0].id : null;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [applyFilter, agentId, filter]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 当 filter 改变时，重新应用过滤（不重新加载数据）
  useEffect(() => {
    if (isInitialLoad) {
      return;
    }
    const filtered = applyFilter(conversations);
    setFilteredConversations(sortByUpdatedAtDesc(filtered));
  }, [filter, conversations, isInitialLoad, applyFilter]);

  useEffect(() => {
    if (isInitialLoad) {
      return;
    }
    const handler = setTimeout(async () => {
      const query = searchQuery.trim();
      searchRef.current = query;
      if (!query) {
        const filtered = applyFilter(conversations);
        setFilteredConversations(sortByUpdatedAtDesc(filtered));
        return;
      }
      try {
        setLoading(true);
        const data = await searchConversations(query, agentId ?? undefined);
        const filtered = applyFilter(data);
        setFilteredConversations(sortByUpdatedAtDesc(filtered));
      } catch (error) {
        console.error(error);
        setFilteredConversations([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, conversations, isInitialLoad, applyFilter, agentId]);

  const selectConversation = useCallback((conversationId: number | null) => {
    setSelectedConversationId((prev) =>
      prev === conversationId ? prev : conversationId
    );
  }, []);

  const updateConversation = useCallback(
    (
      conversationId: number,
      updater: (conversation: ConversationSummary) => ConversationSummary,
      options?: { skipResort?: boolean }
    ) => {
      const applyUpdate = (list: ConversationSummary[]) => {
        let changed = false;
        const next = list.map((conv) => {
          if (conv.id === conversationId) {
            changed = true;
            return updater(conv);
          }
          return conv;
        });
        if (!changed) {
          return list;
        }
        if (options?.skipResort) {
          return next;
        }
        return sortByUpdatedAtDesc(next);
      };

      setConversations((prev) => applyUpdate(prev));
      setFilteredConversations((prev) => {
        if (searchRef.current && !prev.some((item) => item.id === conversationId)) {
          return prev;
        }
        return applyUpdate(prev);
      });
    },
    []
  );

  const setAllConversations = useCallback((data: ConversationSummary[]) => {
    setConversations(data);
    if (!searchRef.current.trim()) {
      const filtered = applyFilter(data);
      setFilteredConversations(filtered);
    }
  }, [applyFilter]);

  const hasConversation = useCallback(
    (conversationId: number) => {
      return conversations.some((conv) => conv.id === conversationId);
    },
    [conversations]
  );

  // 建立全局 WebSocket 连接以接收 visitor_status_update 等全局事件
  // 使用第一个对话的 ID（如果存在），否则不建立连接
  const globalConversationId = conversations.length > 0 ? conversations[0].id : null;

  // 处理 visitor_status_update 事件
  const handleVisitorStatusUpdate = useCallback(
    (event: WSMessage<ChatWebSocketPayload>) => {
      if (event.type === "visitor_status_update" && event.data) {
        const payload = event.data as VisitorStatusUpdatePayload;
        if (payload?.conversation_id) {
          if (payload.is_online === true) {
            // 在线：更新为当前时间（实时更新在线状态）
            updateConversation(payload.conversation_id, (conv) => ({
              ...conv,
              last_seen_at: new Date().toISOString(),
            }));
          }
          // 离线时，last_seen_at 会在后端更新，这里不需要特殊处理
          // 因为对话列表会定期刷新，或者通过其他方式更新
        }
      }
    },
    [updateConversation]
  );

  // 建立全局 WebSocket 连接（用于接收全局事件）
  useWebSocket<ChatWebSocketPayload>({
    conversationId: globalConversationId,
    enabled: Boolean(globalConversationId && agentId),
    isVisitor: false,
    agentId: agentId ?? undefined,
    onMessage: handleVisitorStatusUpdate,
    onError: (error) => {
      // 静默处理错误，避免影响用户体验
    },
    onClose: () => {
      // 静默处理关闭，避免影响用户体验
    },
  });

  const contextValue = useMemo(
    () => ({
      conversations,
      filteredConversations,
      selectedConversationId,
      searchQuery,
      loading,
      isInitialLoad,
      setSearchQuery,
      selectConversation,
      refresh: loadConversations,
      updateConversation,
      setAllConversations,
      hasConversation,
    }),
    [
      conversations,
      filteredConversations,
      selectedConversationId,
      searchQuery,
      loading,
      isInitialLoad,
      selectConversation,
      loadConversations,
      updateConversation,
      setAllConversations,
      setSearchQuery,
      hasConversation,
    ]
  );

  return contextValue;
}

