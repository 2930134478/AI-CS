"use client";

import { useEffect, useRef } from "react";
import { WSClient, WSMessage } from "@/lib/websocket";

interface UseWebSocketOptions<T> {
  conversationId: number | null;
  enabled?: boolean;
  isVisitor?: boolean; // 是否是访客（默认为 true）
  agentId?: number; // 客服ID（如果是客服连接，需要传递）
  onMessage: (payload: WSMessage<T>) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export function useWebSocket<T>({
  conversationId,
  enabled = true,
  isVisitor = true, // 默认是访客
  agentId,
  onMessage,
  onError,
  onClose,
}: UseWebSocketOptions<T>) {
  // 使用 useRef 存储最新的回调函数，避免因回调函数变化导致重新连接
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);

  // 更新 ref 的值
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onCloseRef.current = onClose;
  }, [onMessage, onError, onClose]);

  useEffect(() => {
    if (!conversationId || !enabled) {
      return;
    }

    const client = new WSClient<T>({
      conversationId,
      isVisitor,
      agentId,
      // 使用 ref 的 current 值，这样即使回调函数变化也不会导致重新连接
      onMessage: (payload) => onMessageRef.current(payload),
      onError: onErrorRef.current
        ? (error) => onErrorRef.current?.(error)
        : undefined,
      onClose: onCloseRef.current ? () => onCloseRef.current?.() : undefined,
    });

    client.connect();

    return () => {
      client.disconnect();
    };
    // 只依赖 conversationId、enabled、isVisitor 和 agentId，不依赖回调函数
    // 回调函数通过 useRef 存储，不会导致重新连接
  }, [conversationId, enabled, isVisitor, agentId]);
}

