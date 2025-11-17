"use client";

import { useCallback, useMemo, useState } from "react";

import { useAuth } from "@/features/agent/hooks/useAuth";
import { useConversations } from "@/features/agent/hooks/useConversations";
import { useMessages } from "@/features/agent/hooks/useMessages";
import { useProfile } from "@/features/agent/hooks/useProfile";
import { Profile } from "@/features/agent/types";
import { ChatHeader } from "./ChatHeader";
import { ConversationSidebar } from "./ConversationSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { NavigationSidebar } from "./NavigationSidebar";
import { ProfileModal } from "./ProfileModal";
import { VisitorDetailPanel } from "./VisitorDetailPanel";

export function DashboardShell() {
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
  } = useConversations();

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
  } = useMessages({
    conversationId: selectedConversationId,
    agentId: agent?.id ?? null,
    updateConversation,
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
  const handleSendMessage = useCallback(async () => {
    const content = messageInput.trim();
    if (!content) {
      return;
    }
    try {
      await sendMessage(content);
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

  if (authLoading || (loading && isInitialLoad)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <DashboardHeader
          username={agent.username}
          role={agent.role}
          avatarUrl={profile?.avatar_url}
          onLogout={logout}
          onProfileClick={() => setProfileModalOpen(true)}
        />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ConversationSidebar
            conversations={filteredConversations}
            selectedConversationId={selectedConversationId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={handleConversationSelect}
          />

          <div className="flex-1 flex flex-col bg-white min-h-0">
            {selectedConversationId ? (
              <>
                <ChatHeader
                  conversationId={selectedConversationId}
                  lastSeenAt={conversationDetail?.last_seen_at}
                  unreadCount={selectedUnreadCount}
                  onMarkAllRead={handleMarkAllRead}
                  onRefresh={handleRefreshChat}
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
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                选择一个对话开始聊天
              </div>
            )}
          </div>

          <VisitorDetailPanel
            conversation={selectedConversation}
            detail={conversationDetail}
            onRefresh={handleRefreshVisitor}
            onUpdateContact={updateContactInfo}
          />
        </div>
      </div>

      {/* 个人资料弹窗 */}
      <ProfileModal
        profile={profile}
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}

