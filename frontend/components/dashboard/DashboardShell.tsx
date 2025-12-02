"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { useAuth } from "@/features/agent/hooks/useAuth";
import { useConversations } from "@/features/agent/hooks/useConversations";
import { useMessages } from "@/features/agent/hooks/useMessages";
import { useProfile } from "@/features/agent/hooks/useProfile";
import { Profile } from "@/features/agent/types";
import { ResponsiveLayout } from "@/components/layout";
import { LAYOUT } from "@/lib/constants/breakpoints";
import { ChatHeader } from "./ChatHeader";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { NavigationSidebar, type NavigationPage } from "./NavigationSidebar";
import { ProfileModal } from "./ProfileModal";
import { VisitorDetailPanel } from "./VisitorDetailPanel";

// 动态导入其他页面组件
const FAQsPage = dynamic(() => import("@/app/agent/faqs/page").then(mod => ({ default: mod.default })), { ssr: false });
const UsersPage = dynamic(() => import("@/app/agent/users/page").then(mod => ({ default: mod.default })), { ssr: false });
const SettingsPage = dynamic(() => import("@/app/agent/settings/page").then(mod => ({ default: mod.default })), { ssr: false });

export function DashboardShell() {
  // 登录状态：负责从本地存储读取客服信息，并提供登出方法
  const { agent, loading: authLoading, logout } = useAuth();
  
  // 页面状态管理（必须在所有其他 Hooks 之前声明，确保 Hooks 调用顺序一致）
  const [currentPage, setCurrentPage] = useState<NavigationPage>("dashboard");

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

  // 会话状态：包含会话列表、搜索关键字、选中的会话等
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
            agentId: agent?.id ?? null, // 传递客服ID，用于建立全局 WebSocket 连接
            filter: conversationFilter, // 传递过滤类型
          });

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
  } = useMessages({
    conversationId: selectedConversationId,
    agentId: agent?.id ?? null,
    updateConversation,
    refreshConversations,
    hasConversation,
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
      alert((error as Error).message);
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

  // 处理导航切换（必须在所有条件返回之前声明）
  const handleNavigate = useCallback((page: NavigationPage) => {
    setCurrentPage(page);
    // 如果切换到非 dashboard 页面，清空选中的对话
    if (page !== "dashboard") {
      selectConversation(null);
    }
  }, [selectConversation]);

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

  // 构建侧边栏内容（包含导航栏和对话列表）
  // 在 dashboard 页面时，显示导航栏 + 对话列表
  // 在其他页面时，只显示导航栏
  const sidebarContent = currentPage === "dashboard" ? (
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

  // 构建主内容区
  const mainContent = (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {currentPage === "dashboard" ? (
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
            />
            <MessageList
              messages={messages}
              loading={loadingMessages}
              highlightKeyword={highlightKeyword}
              onHighlightClear={clearHighlight}
              currentUserIsAgent={true}
              conversationId={selectedConversationId ?? null}
              onMarkMessagesRead={markMessagesAsRead}
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
            选择一个对话开始聊天
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentPage === "faqs" && <FAQsPage embedded={true} />}
          {currentPage === "users" && <UsersPage embedded={true} />}
          {currentPage === "settings" && <SettingsPage embedded={true} />}
        </div>
      )}
    </div>
  );

  // 构建右侧面板（仅在 dashboard 页面且选中对话时显示）
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
        sidebarWidth={currentPage === "dashboard" ? undefined : LAYOUT.navigationWidth}
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
