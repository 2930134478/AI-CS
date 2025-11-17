"use client";

import { useEffect, useRef } from "react";
import { MessageItem } from "@/features/agent/types";
import { formatMessageTime } from "@/utils/format";
import { highlightText } from "@/utils/highlight";

interface MessageListProps {
  messages: MessageItem[];
  loading: boolean;
  highlightKeyword: string;
  onHighlightClear: () => void;
  currentUserIsAgent?: boolean;
  disableAutoScroll?: boolean;
  conversationId?: number | null;
  onMarkMessagesRead?: (conversationId: number, readerIsAgent: boolean) => void;
}

export function MessageList({
  messages,
  loading,
  highlightKeyword,
  onHighlightClear,
  currentUserIsAgent = true,
  disableAutoScroll = false,
  conversationId = null,
  onMarkMessagesRead,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const shouldStickToBottomRef = useRef(true);
  const lastConversationIdRef = useRef<number | null>(null);
  const markReadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMarkedReadRef = useRef<number>(0);
  const lastMessageIdRef = useRef<number | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  useEffect(() => {
    if (conversationId !== lastConversationIdRef.current) {
      lastConversationIdRef.current = conversationId;
      shouldStickToBottomRef.current = true;
      lastMessageIdRef.current = null;
      lastMessageCountRef.current = 0;
    }
  }, [conversationId]);

  // 监听滚动事件，当滚动到底部附近时标记消息为已读
  // 注意：即使 disableAutoScroll 为 true，也应该允许通过滚动来标记消息为已读
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !conversationId || !onMarkMessagesRead) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distanceToBottom < 100;
      shouldStickToBottomRef.current = isNearBottom;

      // 当滚动到底部附近时，检查是否有未读消息需要标记为已读
      if (isNearBottom) {
        // 防抖：延迟 500ms 后标记为已读，避免频繁调用
        if (markReadTimerRef.current) {
          clearTimeout(markReadTimerRef.current);
        }
        markReadTimerRef.current = setTimeout(() => {
          // 检查是否有未读的消息（对方发送的消息）
          const unreadMessages = messages.filter((msg) => {
            // 对于客服端：检查访客发送的未读消息
            // 对于访客端：检查客服发送的未读消息
            const isFromOther = currentUserIsAgent
              ? !msg.sender_is_agent
              : msg.sender_is_agent;
            return isFromOther && !msg.is_read;
          });

          if (unreadMessages.length > 0) {
            // 避免频繁调用：如果距离上次标记不到 2 秒，则跳过
            const now = Date.now();
            if (now - lastMarkedReadRef.current < 2000) {
              return;
            }
            // 标记为已读
            onMarkMessagesRead(conversationId, currentUserIsAgent);
            lastMarkedReadRef.current = now;
          }
        }, 500);
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (markReadTimerRef.current) {
        clearTimeout(markReadTimerRef.current);
      }
    };
  }, [conversationId, onMarkMessagesRead, messages, currentUserIsAgent]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const keyword = highlightKeyword.trim();
    const lastMessage = messages[messages.length - 1];
    const isLastMessageFromCurrentUser = lastMessage
      ? currentUserIsAgent
        ? lastMessage.sender_is_agent
        : !lastMessage.sender_is_agent
      : false;

    // 检查是否有新消息（通过比较消息ID或消息数量）
    const hasNewMessage =
      lastMessage.id !== lastMessageIdRef.current ||
      messages.length !== lastMessageCountRef.current;

    // 更新记录
    lastMessageIdRef.current = lastMessage.id;
    lastMessageCountRef.current = messages.length;

    // 使用 requestAnimationFrame 确保 DOM 已更新后再检查位置
    requestAnimationFrame(() => {
      // 重新获取容器引用，确保使用最新的 DOM 元素
      const currentContainer = containerRef.current;
      if (!currentContainer) {
        return;
      }

      // 在 DOM 更新后检查当前位置
      const { scrollTop, scrollHeight, clientHeight } = currentContainer;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distanceToBottom < 100;
      // 更新 shouldStickToBottomRef，确保使用最新的位置信息
      shouldStickToBottomRef.current = isNearBottom;

      // 滚动逻辑：
      // 1. 如果最后一条消息是自己发送的，无论在哪里都自动滚动到底部（即使 disableAutoScroll 为 true）
      // 2. 如果最后一条消息是对方发送的：
      //    - 如果用户在底部附近（isNearBottom），无论 disableAutoScroll 是什么值，都自动滚动到底部（保持"粘到底部"的行为）
      //    - 如果用户不在底部附近，且 disableAutoScroll 为 true，不自动滚动（用于查看历史消息时不被新消息打断）
      //    - 如果用户不在底部附近，且 disableAutoScroll 为 false，不自动滚动（与上面的行为一致）
      // 3. 如果没有新消息（例如只是消息状态更新），不改变滚动位置
      // 这样确保访客端和客服端的行为一致：当用户在底部附近时，收到新消息会自动滚动到底部
      const shouldAutoScroll =
        hasNewMessage &&
        (isLastMessageFromCurrentUser || isNearBottom);

      if (keyword) {
        const keywordLower = keyword.toLowerCase();
        const matchingMessage = messages.find((message) =>
          message.content.toLowerCase().includes(keywordLower)
        );

        if (matchingMessage) {
          const scroll = () => {
            const target = messageRefs.current[matchingMessage.id];
            if (target) {
              target.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
            }
            setTimeout(onHighlightClear, 3000);
          };

          setTimeout(scroll, 200);
        } else {
          if (!shouldAutoScroll) {
            return;
          }
          const scrollBottom = () => {
            const container = containerRef.current;
            if (!container) {
              return;
            }
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });
          };
          setTimeout(scrollBottom, 100);
          onHighlightClear();
        }
      } else {
        if (!shouldAutoScroll) {
          return;
        }
        const scrollBottom = () => {
          const container = containerRef.current;
          if (!container) {
            return;
          }
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        };
        setTimeout(scrollBottom, 100);
      }

      // 当消息列表更新且自动滚动到底部时，检查是否需要标记为已读
      // 或者如果用户已经在底部附近，也应该标记为已读（即使没有自动滚动）
      if (conversationId && onMarkMessagesRead && messages.length > 0) {
        // 延迟标记为已读，确保滚动动画完成
        if (markReadTimerRef.current) {
          clearTimeout(markReadTimerRef.current);
        }
        markReadTimerRef.current = setTimeout(() => {
          // 如果自动滚动到底部，或者用户已经在底部附近，都标记为已读
          const shouldMarkRead = shouldAutoScroll || isNearBottom;
          if (!shouldMarkRead) {
            return;
          }

          const unreadMessages = messages.filter((msg) => {
            const isFromOther = currentUserIsAgent
              ? !msg.sender_is_agent
              : msg.sender_is_agent;
            return isFromOther && !msg.is_read;
          });

          if (unreadMessages.length > 0) {
            // 避免频繁调用：如果距离上次标记不到 2 秒，则跳过
            const now = Date.now();
            if (now - lastMarkedReadRef.current < 2000) {
              return;
            }
            onMarkMessagesRead(conversationId, currentUserIsAgent);
            lastMarkedReadRef.current = now;
          }
        }, shouldAutoScroll ? 800 : 300); // 如果自动滚动，等待 800ms；否则等待 300ms
      }
    });
  }, [
    messages,
    highlightKeyword,
    onHighlightClear,
    disableAutoScroll,
    currentUserIsAgent,
    conversationId,
    onMarkMessagesRead,
  ]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <span className="text-sm text-gray-500">消息加载中...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="text-center text-gray-400 mt-8 text-sm">暂无消息</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 bg-gray-50"
    >
      <div className="space-y-4">
        {messages.map((message) => {
          const keyword = highlightKeyword.trim();
          const isMatching =
            keyword !== "" &&
            message.content.toLowerCase().includes(keyword.toLowerCase());
          const bubbleContent =
            keyword !== "" && isMatching
              ? highlightText(message.content, keyword)
              : message.content;

          if (message.message_type === "system_message") {
            return (
              <div
                key={message.id}
                ref={(element) => {
                  messageRefs.current[message.id] = element;
                }}
                className={`text-center text-xs text-gray-500`}
              >
                <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-700">
                  {message.content}
                </span>
              </div>
            );
          }

          const isSenderAgent = message.sender_is_agent;
          const isCurrentUser = currentUserIsAgent
            ? isSenderAgent
            : !isSenderAgent;
          const alignment = isCurrentUser ? "justify-end" : "justify-start";
          const bubbleColor = isCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-800 border border-gray-200";
          const cornerClass = isCurrentUser ? "rounded-br-none" : "rounded-bl-none";
          const receiptClass = isCurrentUser
            ? message.is_read
              ? currentUserIsAgent
                ? "text-blue-400"
                : "text-blue-200"
              : currentUserIsAgent
              ? ""
              : "text-blue-200"
            : "";

          return (
            <div
              key={message.id}
              ref={(element) => {
                messageRefs.current[message.id] = element;
              }}
              className={`flex ${alignment}`}
            >
              <div className="max-w-[70%]">
                <div
                  className={`px-4 py-2 rounded-2xl shadow-sm ${
                    cornerClass
                  } ${bubbleColor}`}
                >
                  <div className="whitespace-pre-wrap break-words text-sm">
                    {bubbleContent}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                  {isCurrentUser && (
                    <span className={receiptClass}>
                      {message.is_read ? "✓✓" : "✓"}
                    </span>
                  )}
                  <span>{formatMessageTime(message.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

