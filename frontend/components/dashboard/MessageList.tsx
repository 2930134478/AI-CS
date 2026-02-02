"use client";

import { useEffect, useRef, useState } from "react";
import { MessageItem } from "@/features/agent/types";
import { formatMessageTime } from "@/utils/format";
import { highlightText } from "@/utils/highlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Paperclip, Download, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

interface MessageListProps {
  messages: MessageItem[];
  loading: boolean;
  highlightKeyword: string;
  onHighlightClear: () => void;
  currentUserIsAgent?: boolean;
  disableAutoScroll?: boolean;
  conversationId?: number | null;
  onMarkMessagesRead?: (conversationId: number, readerIsAgent: boolean) => void;
  /** 底部插槽（如 AI 正在输入提示），会渲染在消息列表最下方并参与滚动 */
  bottomSlot?: React.ReactNode;
  /** 知识库测试（内部对话）模式：AI 回复（sender_id=0）显示在左侧，客服消息显示在右侧 */
  internalChatMode?: boolean;
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
  bottomSlot,
  internalChatMode = false,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const shouldStickToBottomRef = useRef(true);
  const lastConversationIdRef = useRef<number | null>(null);
  const markReadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMarkedReadRef = useRef<number>(0);
  const lastMessageIdRef = useRef<number | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const hasInitialScrolledRef = useRef(false); // 标记是否已经完成初始滚动
  // 图片预览状态（必须在所有条件返回之前声明）
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId !== lastConversationIdRef.current) {
      lastConversationIdRef.current = conversationId;
      shouldStickToBottomRef.current = true;
      lastMessageIdRef.current = null;
      lastMessageCountRef.current = 0;
      hasInitialScrolledRef.current = false; // 重置初始滚动标记
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
            const isFromOther = internalChatMode
              ? msg.sender_is_agent && msg.sender_id === 0 // 内部对话：AI 回复视为对方
              : currentUserIsAgent
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
  }, [conversationId, onMarkMessagesRead, messages, currentUserIsAgent, internalChatMode]);

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

      // 对于新消息，需要延迟一点再检查位置，确保 DOM 完全更新（特别是图片/文件消息）
      // 使用双重 requestAnimationFrame + 小延迟，给图片加载留出时间
      const checkAndScroll = () => {
        const container = containerRef.current;
        if (!container) {
          return;
        }

        // 在 DOM 更新后检查当前位置
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        const isNearBottom = distanceToBottom < 100;
        // 更新 shouldStickToBottomRef，确保使用最新的位置信息
        shouldStickToBottomRef.current = isNearBottom;

        // 检查是否是初始加载（首次加载消息或切换对话后首次加载）
        const isInitialLoad = !hasInitialScrolledRef.current && messages.length > 0;

        // 滚动逻辑：
        // 1. 如果是初始加载（首次加载消息或切换对话），无论什么情况都自动滚动到底部
        // 2. 如果最后一条消息是自己发送的，无论在哪里都自动滚动到底部（即使 disableAutoScroll 为 true）
        // 3. 如果最后一条消息是对方发送的：
        //    - 如果用户在底部附近（isNearBottom），无论 disableAutoScroll 是什么值，都自动滚动到底部（保持"粘到底部"的行为）
        //    - 如果用户不在底部附近，且 disableAutoScroll 为 true，不自动滚动（用于查看历史消息时不被新消息打断）
        //    - 如果用户不在底部附近，且 disableAutoScroll 为 false，不自动滚动（与上面的行为一致）
        // 4. 如果没有新消息（例如只是消息状态更新），不改变滚动位置
        // 这样确保访客端和客服端的行为一致：初始加载时显示最新消息，当用户在底部附近时，收到新消息会自动滚动到底部
        const shouldAutoScroll =
          isInitialLoad ||
          (hasNewMessage &&
            (isLastMessageFromCurrentUser ||
              isNearBottom ||
              (!currentUserIsAgent && !isLastMessageFromCurrentUser)));

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
              behavior: isInitialLoad ? "auto" : "smooth", // 初始加载时使用 instant，避免动画
            });
            // 标记初始滚动已完成
            if (isInitialLoad) {
              hasInitialScrolledRef.current = true;
            }
          };
          setTimeout(scrollBottom, isInitialLoad ? 0 : 100); // 初始加载时立即滚动
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
            if (container.scrollHeight === container.clientHeight && container.parentElement) {
              const parent = container.parentElement;
              const parentHeight = parent.offsetHeight;
              container.style.height = `${parentHeight}px`;
              container.style.maxHeight = `${parentHeight}px`;
            }
            // 访客端收到对方（如 AI）的新消息时：从该气泡头部开始显示，长消息无需往上翻
            const lastMsgEl = messageRefs.current[lastMessage.id];
            if (
              lastMsgEl &&
              !currentUserIsAgent &&
              !isLastMessageFromCurrentUser
            ) {
              lastMsgEl.scrollIntoView({
                block: "start",
                behavior: isInitialLoad ? "auto" : "smooth",
                inline: "nearest",
              });
            } else {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: isInitialLoad ? "auto" : "smooth",
              });
            }
            if (isInitialLoad) {
              hasInitialScrolledRef.current = true;
            }
          };
          setTimeout(scrollBottom, isInitialLoad ? 0 : 100);
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
              const isFromOther = internalChatMode
                ? msg.sender_is_agent && msg.sender_id === 0
                : currentUserIsAgent
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
      };

      // 对于新消息，延迟一点再检查位置，确保 DOM 完全更新（特别是图片/文件消息）
      if (hasNewMessage) {
        // 检查最后一条消息是否包含图片/文件
        const lastMessageHasFile = lastMessage.file_url;
        
        if (lastMessageHasFile) {
          // 如果包含文件，延迟更长时间，确保图片加载完成
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                checkAndScroll();
              }, 200); // 给图片加载留出更多时间
            });
          });
        } else {
          // 普通消息，正常延迟
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              checkAndScroll();
            });
          });
        }
      } else {
        // 非新消息（如状态更新），直接检查
        checkAndScroll();
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
    internalChatMode,
  ]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <span className="text-sm text-muted-foreground">消息加载中...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-muted/30 scrollbar-auto">
        <div className="text-center text-muted-foreground mt-8 text-sm">暂无消息</div>
      </div>
    );
  }

  return (
    <>
      {/* 图片预览对话框 */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {previewImageUrl && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setImagePreviewOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              <img
                src={previewImageUrl}
                alt="预览"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto p-4 bg-muted/30 scrollbar-auto"
        style={{ height: '100%' }}
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
                className={`text-center text-xs text-muted-foreground`}
              >
                <Badge variant="secondary" className="inline-block">
                  {message.content}
                </Badge>
              </div>
            );
          }

          const isSenderAgent = Boolean(message.sender_is_agent);
          // 内部对话（知识库测试）：AI 回复 sender_id=0 显示左侧，客服消息显示右侧
          const isCurrentUser = internalChatMode
            ? isSenderAgent && message.sender_id !== 0
            : currentUserIsAgent
              ? isSenderAgent
              : !isSenderAgent;
          const alignment = isCurrentUser ? "justify-end" : "justify-start";
          const bubbleColor = isCurrentUser
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-card text-card-foreground border border-border/50 shadow-sm";
          const cornerClass = isCurrentUser ? "rounded-br-none" : "rounded-bl-none";
          // 计算已读回执的样式类名
          // 统一使用相同的样式：蓝色半透明（text-primary/70）
          // 因为访客端和客服端的当前用户消息都是蓝色背景（bg-primary），所以使用相同的样式
          const receiptClass = isCurrentUser ? "text-primary/70" : "";

          // 文件相关
          const hasFile = Boolean(message.file_url);
          const isImage = message.file_type === "image";
          const isDocument = message.file_type === "document";

          // 获取文件URL（完整URL）
          const getFileUrl = (fileUrl: string | null | undefined): string => {
            if (!fileUrl) return "";
            if (fileUrl.startsWith("http")) return fileUrl;
            return `${API_BASE_URL}${fileUrl}`;
          };

          // 格式化文件大小
          const formatFileSize = (bytes: number | null | undefined): string => {
            if (!bytes) return "";
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
            return (bytes / (1024 * 1024)).toFixed(1) + " MB";
          };

          // 打开图片预览
          const handleImageClick = (url: string) => {
            setPreviewImageUrl(url);
            setImagePreviewOpen(true);
          };

          // 下载文件
          const handleDownload = (url: string, fileName: string | null | undefined) => {
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || "file";
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

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
                  className={`px-4 py-2.5 rounded-2xl ${
                    cornerClass
                  } ${bubbleColor} transition-shadow hover:shadow-md`}
                >
                  {/* 文本内容 */}
                  {message.content && (
                    <div className="whitespace-pre-wrap break-words text-sm">
                      {bubbleContent}
                    </div>
                  )}
                  
                  {/* 文件显示 */}
                  {hasFile && message.file_url && (
                    <div className={message.content ? "mt-2" : ""}>
                      {isImage ? (
                        // 图片预览
                        <div
                          className="cursor-pointer rounded-lg overflow-hidden max-w-[300px] border border-border/30 hover:border-primary/50 transition-colors shadow-sm"
                          onClick={() => handleImageClick(getFileUrl(message.file_url))}
                        >
                          <img
                            src={getFileUrl(message.file_url)}
                            alt={message.file_name || "图片"}
                            className="max-w-full h-auto"
                            loading="lazy"
                          />
                        </div>
                      ) : isDocument ? (
                        // 文档显示
                        <div className="flex items-center gap-2 p-3 bg-background/60 rounded-lg border border-border/30 hover:bg-background/80 transition-colors">
                          <Paperclip className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {message.file_name || "文件"}
                            </div>
                            {message.file_size && (
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(message.file_size)}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                getFileUrl(message.file_url),
                                message.file_name
                              )
                            }
                            className="flex-shrink-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
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
        {bottomSlot}
      </div>
    </>
  );
}

