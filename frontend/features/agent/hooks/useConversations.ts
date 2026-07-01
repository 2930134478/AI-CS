"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchConversations,
  searchConversations,
} from "../../agent/services/conversationApi";
import type { ConversationListType } from "../../agent/services/conversationApi";
import type { ConversationStatus } from "../../agent/services/conversationApi";
import {
  ConversationSummary,
  MessageItem,
  VisitorStatusUpdatePayload,
} from "../../agent/types";
import { useWebSocket } from "./useWebSocket";
import { WSMessage } from "@/lib/websocket";
import { ChatWebSocketPayload } from "../../agent/types";
import { buildMessagePreview } from "@/utils/format";
import { getAgentWSToken } from "@/utils/storage";

const sortByUpdatedAtDesc = (list: ConversationSummary[]) =>
  [...list].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

import type { ConversationFilter } from "@/components/dashboard/ConversationHeader";

const PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 15000;

interface UseConversationsOptions {
  agentId?: number | null;
  filter?: ConversationFilter;
  /** 内部对话（知识库测试）时传 "internal"，默认访客对话 "visitor" */
  listType?: ConversationListType;
  /** 会话状态：open（进行中）/ closed（历史） */
  status?: ConversationStatus;
  /** 为 false 时不加载列表、不轮询（非会话页使用） */
  enabled?: boolean;
  /** 轮询间隔毫秒；0 表示不轮询 */
  pollIntervalMs?: number;
}

export function useConversations(options?: UseConversationsOptions) {
  const {
    agentId,
    filter = "all",
    listType = "visitor",
    status = "open",
    enabled = true,
    pollIntervalMs = POLL_INTERVAL_MS,
  } = options || {};
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    ConversationSummary[]
  >([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(enabled);
  const [hasMore, setHasMore] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const pageRef = useRef(1);
  const prevListTypeRef = useRef(listType);

  const searchRef = useRef("");
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsToken = getAgentWSToken() ?? undefined;

  const applyFilter = useCallback(
    (list: ConversationSummary[]): ConversationSummary[] => {
      if (!agentId) {
        return list;
      }

      switch (filter) {
        case "mine":
          return list.filter((conv) => conv.has_participated === true);
        case "others":
          return list.filter((conv) => conv.has_participated !== true);
        case "all":
        default:
          return list;
      }
    },
    [agentId, filter]
  );

  const mergeConversationPages = useCallback(
    (
      prev: ConversationSummary[],
      nextItems: ConversationSummary[],
      replace: boolean
    ) => {
      if (replace) {
        return nextItems;
      }
      const map = new Map<number, ConversationSummary>();
      for (const item of prev) {
        map.set(item.id, item);
      }
      for (const item of nextItems) {
        map.set(item.id, item);
      }
      return sortByUpdatedAtDesc(Array.from(map.values()));
    },
    []
  );

  const loadConversations = useCallback(
    async (opts?: { append?: boolean }) => {
      if (!enabled) {
        return;
      }
      const append = opts?.append ?? false;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        pageRef.current = 1;
      }

      try {
        if (listType === "internal" && !agentId) {
          setConversations([]);
          setFilteredConversations([]);
          setSelectedConversationId(null);
          setHasMore(false);
          setTotalUnread(0);
          return;
        }

        const page = append ? pageRef.current + 1 : 1;
        const result = await fetchConversations(
          agentId ?? undefined,
          listType === "internal"
            ? { type: "internal", status, page, page_size: PAGE_SIZE }
            : { status, page, page_size: PAGE_SIZE }
        );

        pageRef.current = page;
        setHasMore(result.has_more);
        setTotalUnread(result.total_unread);

        setConversations((prev) => {
          const merged = mergeConversationPages(prev, result.items, !append);
          if (!searchRef.current.trim()) {
            const filtered =
              listType === "internal" ? merged : applyFilter(merged);
            const sorted = sortByUpdatedAtDesc(filtered);
            setFilteredConversations(sorted);
            if (!append) {
              setSelectedConversationId((prevSelected) => {
                if (prevSelected && sorted.some((c) => c.id === prevSelected)) {
                  return prevSelected;
                }
                return sorted.length > 0 ? sorted[0].id : null;
              });
            }
          }
          return merged;
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    },
    [enabled, applyFilter, agentId, listType, status, mergeConversationPages]
  );

  const loadMoreConversations = useCallback(async () => {
    if (!enabled || loading || loadingMore || !hasMore || searchRef.current.trim()) {
      return;
    }
    await loadConversations({ append: true });
  }, [enabled, loading, loadingMore, hasMore, loadConversations]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setIsInitialLoad(false);
      return;
    }
    void loadConversations();
  }, [enabled, loadConversations]);

  // 切换 listType（访客对话 ↔ 知识库测试）时立即清空，避免串台
  useEffect(() => {
    if (prevListTypeRef.current !== listType) {
      prevListTypeRef.current = listType;
      setConversations([]);
      setFilteredConversations([]);
      setSelectedConversationId(null);
      setHasMore(false);
      setTotalUnread(0);
      pageRef.current = 1;
      searchRef.current = "";
      setSearchQuery("");
    }
  }, [listType]);

  useEffect(() => {
    if (!enabled || !agentId || pollIntervalMs <= 0) {
      return;
    }
    const interval = setInterval(() => {
      void loadConversations();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, agentId, pollIntervalMs, loadConversations]);

  useEffect(() => {
    if (isInitialLoad) {
      return;
    }
    const filtered = listType === "internal" ? conversations : applyFilter(conversations);
    setFilteredConversations(sortByUpdatedAtDesc(filtered));
  }, [filter, listType, conversations, isInitialLoad, applyFilter]);

  useEffect(() => {
    if (!enabled || isInitialLoad) {
      return;
    }
    const handler = setTimeout(async () => {
      const query = searchQuery.trim();
      searchRef.current = query;
      if (!query) {
        const filtered = listType === "internal" ? conversations : applyFilter(conversations);
        setFilteredConversations(sortByUpdatedAtDesc(filtered));
        return;
      }
      if (listType === "internal") {
        setFilteredConversations(
          sortByUpdatedAtDesc(
            conversations.filter((c) =>
              (c.last_message?.content ?? "").toLowerCase().includes(query.toLowerCase())
            )
          )
        );
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await searchConversations(query, agentId ?? undefined, {
          status,
          type: listType,
        });
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
  }, [enabled, searchQuery, conversations, isInitialLoad, applyFilter, agentId, listType, status]);

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

  const setAllConversations = useCallback(
    (data: ConversationSummary[]) => {
      setConversations(data);
      if (!searchRef.current.trim()) {
        const filtered = applyFilter(data);
        setFilteredConversations(filtered);
      }
    },
    [applyFilter]
  );

  const hasConversation = useCallback(
    (conversationId: number) => {
      return conversations.some((conv) => conv.id === conversationId);
    },
    [conversations]
  );

  const scheduleRefreshConversations = useCallback(() => {
    if (!enabled) {
      return;
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      void loadConversations();
    }, 500);
  }, [enabled, loadConversations]);

  const globalConversationId = conversations.length > 0 ? conversations[0].id : null;

  const handleGlobalWebSocketMessage = useCallback(
    (event: WSMessage<ChatWebSocketPayload>) => {
      if (event.type === "visitor_status_update" && event.data) {
        const payload = event.data as VisitorStatusUpdatePayload;
        if (payload?.conversation_id && payload.is_online === true) {
          updateConversation(payload.conversation_id, (conv) => ({
            ...conv,
            last_seen_at: new Date().toISOString(),
          }));
        }
      } else if (event.type === "new_message" && event.data) {
        const message = event.data as MessageItem;
        if (typeof message?.conversation_id !== "number") {
          return;
        }
        const isConversationExists = hasConversation(message.conversation_id);
        if (!isConversationExists) {
          scheduleRefreshConversations();
          return;
        }
        const isSystemMessage =
          (message.message_type ?? "user_message") === "system_message";
        const isVisitorMessage = !message.sender_is_agent && !isSystemMessage;
        const preview = buildMessagePreview(message.content ?? "");
        updateConversation(message.conversation_id, (conv) => ({
          ...conv,
          updated_at: message.created_at,
          last_seen_at: isVisitorMessage
            ? message.created_at
            : conv.last_seen_at ?? null,
          unread_count: isVisitorMessage
            ? message.conversation_id === selectedConversationId
              ? 0
              : (conv.unread_count ?? 0) + 1
            : conv.unread_count ?? 0,
          last_message: {
            id: message.id,
            content: preview,
            sender_is_agent: message.sender_is_agent,
            message_type: message.message_type ?? "user_message",
            is_read: Boolean(message.is_read),
            read_at: message.read_at ?? null,
            created_at: message.created_at,
          },
        }));
        if (isVisitorMessage && message.conversation_id !== selectedConversationId) {
          setTotalUnread((n) => n + 1);
        }
      }
    },
    [
      hasConversation,
      scheduleRefreshConversations,
      selectedConversationId,
      updateConversation,
    ]
  );

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useWebSocket<ChatWebSocketPayload>({
    conversationId: globalConversationId,
    enabled: Boolean(enabled && globalConversationId && agentId),
    isVisitor: false,
    agentId: agentId ?? undefined,
    wsToken,
    onMessage: handleGlobalWebSocketMessage,
    onError: () => {},
    onClose: () => {},
  });

  return useMemo(
    () => ({
      conversations,
      filteredConversations,
      selectedConversationId,
      searchQuery,
      loading,
      loadingMore,
      isInitialLoad,
      hasMore,
      totalUnread,
      setSearchQuery,
      selectConversation,
      refresh: () => loadConversations(),
      loadMore: loadMoreConversations,
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
      loadingMore,
      isInitialLoad,
      hasMore,
      totalUnread,
      selectConversation,
      loadConversations,
      loadMoreConversations,
      updateConversation,
      setAllConversations,
      hasConversation,
    ]
  );
}
