"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/features/agent/hooks/useAuth";
import { useConversations } from "@/features/agent/hooks/useConversations";
import { useMessages } from "@/features/agent/hooks/useMessages";
import { initInternalConversation } from "@/features/agent/services/conversationApi";
import { toast } from "@/hooks/useToast";
import { useProfile } from "@/features/agent/hooks/useProfile";
import { Profile } from "@/features/agent/types";
import { ResponsiveLayout } from "@/components/layout";
import { LAYOUT } from "@/lib/constants/breakpoints";
import {
  getPageFromSearchParams,
  getAgentPage,
} from "@/lib/constants/agent-pages";
import { Loader2 } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { NavigationSidebar, type NavigationPage } from "./NavigationSidebar";
import { ProfileModal } from "./ProfileModal";
import { VisitorDetailPanel } from "./VisitorDetailPanel";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { usePageTitle } from "@/hooks/usePageTitle";

export function DashboardShell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = getPageFromSearchParams(searchParams);

  // 登录状态：负责从本地存储读取客服信息，并提供登出方法
  const { agent, loading: authLoading, logout } = useAuth();

  // 个人资料状态
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const {
    profile,
    loading: profileLoading,
    refresh: refreshProfile,
    update: updateProfile,
    upload: uploadAvatar,
  } = useProfile({
    userId: agent?.id ?? null,
    enabled: Boolean(agent?.id),
  });

  // 会话过滤状态
  const [conversationFilter, setConversationFilter] = useState<"all" | "mine" | "others">("all");

  // 声音通知开关（客服端）
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundNotification(false);

  const currentPageMeta = getAgentPage(currentPage);
  const isInternalChat = currentPage === "internal-chat";
  const isChatPage = currentPageMeta?.isChatPage ?? false;
  // 会话状态：访客对话或内部对话（知识库测试）根据 currentPage 切换
  const {
    conversations,
    filteredConversations,
    selectedConversationId,
    searchQuery,
    loading,
    isInitialLoad,
    setSearchQuery,
    selectConversation,
    updateConversation,
    refresh: refreshConversations,
    hasConversation,
  } = useConversations({
    agentId: agent?.id ?? null,
    filter: conversationFilter,
    listType: isInternalChat ? "internal" : "visitor",
  });

  // 计算总未读消息数
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0);
  }, [conversations]);

  // 更新页面标题显示未读消息数
  usePageTitle(totalUnreadCount, "AI-CS");

  // 输入框内容与搜索高亮关键字
  const [messageInput, setMessageInput] = useState("");
  const [highlightKeyword, setHighlightKeyword] = useState("");

  // 当前选中的会话信息，供右侧访客详情展示
  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ) ?? null,
    [conversations, selectedConversationId]
  );

  // 消息层：负责消息列表、未读状态、访客详情以及 WebSocket
  const {
    messages,
    loadingMessages,
    sending,
    conversationDetail,
    refreshConversationDetail,
    refreshMessages,
    sendMessage,
    markMessagesAsRead,
    updateContactInfo,
    includeAIMessages,
    toggleAIMessages,
    aiThinking,
  } = useMessages({
    conversationId: selectedConversationId,
    agentId: agent?.id ?? null,
    updateConversation,
    refreshConversations,
    hasConversation,
    soundEnabled,
    forceIncludeAIMessages: isInternalChat,
  });

  // 左侧选择会话时，记录关键字用于消息高亮
  const handleConversationSelect = useCallback(
    (conversationId: number) => {
      if (searchQuery.trim()) {
        setHighlightKeyword(searchQuery.trim());
      } else {
        setHighlightKeyword("");
      }
      selectConversation(conversationId);
    },
    [searchQuery, selectConversation]
  );

  // 发送消息：调用 service 后清空输入框
  const handleSendMessage = useCallback(async (fileInfo?: { file_url: string; file_type: string; file_name: string; file_size: number; mime_type: string }) => {
    const content = messageInput.trim();
    try {
      await sendMessage(content, fileInfo);
      setMessageInput("");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [messageInput, sendMessage]);

  // 标记当前会话全部消息为已读
  const handleMarkAllRead = useCallback(() => {
    if (selectedConversationId) {
      markMessagesAsRead(selectedConversationId, true);
    }
  }, [markMessagesAsRead, selectedConversationId]);

  // 手动刷新消息与访客详情
  const handleRefreshChat = useCallback(() => {
    if (!selectedConversationId) return;
    refreshMessages(selectedConversationId);
    refreshConversationDetail(selectedConversationId);
  }, [refreshConversationDetail, refreshMessages, selectedConversationId]);

  // 单独刷新访客详情
  const handleRefreshVisitor = useCallback(() => {
    if (!selectedConversationId) return;
    refreshConversationDetail(selectedConversationId);
  }, [refreshConversationDetail, selectedConversationId]);

  // 当前会话未读数（优先使用详情返回的数据）
  const selectedUnreadCount =
    conversationDetail?.unread_count ??
    selectedConversation?.unread_count ??
    0;

  // 3 秒后清除搜索高亮
  const clearHighlight = useCallback(() => {
    setHighlightKeyword("");
  }, []);

  // 处理个人资料更新
  const handleProfileUpdate = useCallback(
    (updated: Profile) => {
      // 个人资料更新后，刷新缓存（这里可以通过更新 agent 状态来触发UI更新）
      refreshProfile();
    },
    [refreshProfile]
  );

  // 处理导航切换：更新 URL ?page=，与访客端路由一致，刷新后保留当前页
  const handleNavigate = useCallback((page: NavigationPage) => {
    router.push(pathname + "?page=" + page);
    if (page !== "dashboard" && page !== "internal-chat") {
      selectConversation(null);
    }
  }, [pathname, router, selectConversation]);

  // 新建内部对话（知识库测试）- 必须在条件 return 之前声明，保证 Hooks 顺序一致
  const handleNewInternalConversation = useCallback(async () => {
    if (!agent?.id) return;
    try {
      const { conversation_id } = await initInternalConversation(agent.id);
      refreshConversations();
      selectConversation(conversation_id);
    } catch (e) {
      console.error("创建内部对话失败:", e);
      toast.error((e as Error).message || "创建内部对话失败");
    }
  }, [agent?.id, refreshConversations, selectConversation]);

  if (authLoading || (loading && isInitialLoad)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  const sidebarContent = isChatPage ? (
    <div className="flex h-full">
      <NavigationSidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onProfileClick={() => setProfileModalOpen(true)}
        onLogout={logout}
        avatarUrl={profile?.avatar_url}
      />
      <ConversationSidebar
        conversations={filteredConversations}
        selectedConversationId={selectedConversationId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectConversation={handleConversationSelect}
        filter={conversationFilter}
        onFilterChange={setConversationFilter}
        mode={isInternalChat ? "internal" : "visitor"}
        onNewClick={isInternalChat ? handleNewInternalConversation : undefined}
      />
    </div>
  ) : (
    <div className="flex h-full">
      <NavigationSidebar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onProfileClick={() => setProfileModalOpen(true)}
        onLogout={logout}
        avatarUrl={profile?.avatar_url}
      />
    </div>
  );

  const mainContent = (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {isChatPage ? (
        selectedConversationId ? (
          <>
            <ChatHeader
              conversationId={selectedConversationId}
              lastSeenAt={conversationDetail?.last_seen_at}
              unreadCount={selectedUnreadCount}
              onMarkAllRead={handleMarkAllRead}
              onRefresh={handleRefreshChat}
              includeAIMessages={includeAIMessages}
              onToggleAIMessages={toggleAIMessages}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              hideAIToggle={isInternalChat}
            />
            <MessageList
              messages={messages}
              loading={loadingMessages}
              highlightKeyword={highlightKeyword}
              onHighlightClear={clearHighlight}
              currentUserIsAgent={true}
              conversationId={selectedConversationId ?? null}
              onMarkMessagesRead={markMessagesAsRead}
              internalChatMode={isInternalChat}
              bottomSlot={
                isInternalChat && aiThinking ? (
                  <div className="flex justify-start mt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl rounded-bl-none bg-card border border-border/50 shadow-sm text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span>AI 正在思考...</span>
                    </div>
                  </div>
                ) : null
              }
            />
            <MessageInput
              value={messageInput}
              onChange={setMessageInput}
              onSubmit={handleSendMessage}
              sending={sending}
              conversationId={selectedConversationId ?? undefined}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            {isInternalChat ? "选择或新建内部对话，测试知识库效果" : "选择一个对话开始聊天"}
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {(() => {
            const PageComponent = currentPageMeta?.component;
            return PageComponent != null ? (
              <PageComponent embedded={true} />
            ) : null;
          })()}
        </div>
      )}
    </div>
  );

  const rightPanelContent = currentPage === "dashboard" && selectedConversationId ? (
    <VisitorDetailPanel
      conversation={selectedConversation}
      detail={conversationDetail}
      onRefresh={handleRefreshVisitor}
      onUpdateContact={updateContactInfo}
    />
  ) : undefined;

  return (
    <>
      <ResponsiveLayout
        sidebar={sidebarContent}
        main={mainContent}
        rightPanel={rightPanelContent}
        sidebarWidth={isChatPage ? LAYOUT.dashboardSidebarWidth : LAYOUT.navigationWidth}
      />

      {/* 个人资料弹窗 */}
      <ProfileModal
        profile={profile}
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
    </>
  );
}
