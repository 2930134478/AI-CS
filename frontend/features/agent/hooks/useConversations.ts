"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchConversations,
  searchConversations,
} from "../../agent/services/conversationApi";
import { ConversationSummary } from "../../agent/types";

const sortByUpdatedAtDesc = (list: ConversationSummary[]) =>
  [...list].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

export function useConversations() {
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

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
      if (!searchRef.current.trim()) {
        setFilteredConversations(data);
      }
      setSelectedConversationId((prev) => {
        if (prev) {
          return prev;
        }
        return data.length > 0 ? data[0].id : null;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (isInitialLoad) {
      return;
    }
    const handler = setTimeout(async () => {
      const query = searchQuery.trim();
      searchRef.current = query;
      if (!query) {
        setFilteredConversations(sortByUpdatedAtDesc(conversations));
        return;
      }
      try {
        setLoading(true);
        const data = await searchConversations(query);
        setFilteredConversations(sortByUpdatedAtDesc(data));
      } catch (error) {
        console.error(error);
        setFilteredConversations([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, conversations, isInitialLoad]);

  const selectConversation = useCallback((conversationId: number) => {
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
      setFilteredConversations(data);
    }
  }, []);

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
    ]
  );

  return contextValue;
}

