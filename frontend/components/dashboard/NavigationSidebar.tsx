"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { getAvatarUrl, getAvatarColor, getAvatarInitial } from "@/utils/avatar";
import { Button } from "@/components/ui/button";

export type NavigationPage = "dashboard" | "faqs" | "users" | "settings";

interface NavigationSidebarProps {
  currentPage?: NavigationPage;
  onNavigate?: (page: NavigationPage) => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  avatarUrl?: string | null;
}

export function NavigationSidebar({ 
  currentPage = "dashboard",
  onNavigate,
  onProfileClick,
  onLogout,
  avatarUrl,
}: NavigationSidebarProps) {
  const { agent } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 检查当前用户是否是管理员
  const isAdmin = agent?.role === "admin";

  const handleNavigate = (page: NavigationPage) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  // 头像相关
  const avatarColor = getAvatarColor(agent?.username || "");
  const displayInitial = getAvatarInitial(agent?.username || "");
  const fullAvatarUrl = getAvatarUrl(avatarUrl);

  return (
    <div className="w-16 bg-gray-50 flex flex-col items-center py-4 border-r border-gray-200 h-full">
      <button
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
          currentPage === "dashboard"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-white border border-gray-200 hover:bg-gray-100"
        }`}
        title="对话"
        onClick={() => handleNavigate("dashboard")}
      >
        <svg
          className={`w-6 h-6 ${
            currentPage === "dashboard" ? "text-white" : "text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      <button
        className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-4 hover:bg-gray-100 transition-colors"
        title="知识库"
        disabled
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
          />
        </svg>
      </button>

      <button
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
          currentPage === "faqs"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-white border border-gray-200 hover:bg-gray-100"
        }`}
        title="事件管理"
        onClick={() => handleNavigate("faqs")}
      >
        <svg
          className={`w-6 h-6 ${
            currentPage === "faqs" ? "text-white" : "text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </button>

      {isAdmin && (
        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
            currentPage === "users"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-white border border-gray-200 hover:bg-gray-100"
          }`}
          title="用户管理"
          onClick={() => handleNavigate("users")}
        >
          <svg
            className={`w-6 h-6 ${
              currentPage === "users" ? "text-white" : "text-gray-600"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>
      )}

      <button
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
          currentPage === "settings"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-white border border-gray-200 hover:bg-gray-100"
        }`}
        title="AI 配置"
        onClick={() => handleNavigate("settings")}
      >
        <svg
          className={`w-6 h-6 ${
            currentPage === "settings" ? "text-white" : "text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </button>

      {/* 个人资料按钮（固定在底部） */}
      <div className="mt-auto relative" ref={menuRef}>
        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            profileMenuOpen
              ? "bg-primary text-primary-foreground"
              : "bg-white border border-gray-200 hover:bg-gray-100"
          }`}
          title="个人资料"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        >
          {fullAvatarUrl ? (
            <img
              src={fullAvatarUrl}
              alt={agent?.username || "用户"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: avatarColor }}
            >
              {displayInitial}
            </div>
          )}
        </button>

        {/* 下拉菜单 */}
        {profileMenuOpen && (
          <div className="absolute bottom-12 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* 用户信息 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {fullAvatarUrl ? (
                  <img
                    src={fullAvatarUrl}
                    alt={agent?.username || "用户"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {displayInitial}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {agent?.username || "用户"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {agent?.role === "admin" ? "管理员" : "客服"}
                  </div>
                </div>
              </div>
            </div>

            {/* 菜单项 */}
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onProfileClick?.();
                }}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                个人资料
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout?.();
                }}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                退出登录
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

