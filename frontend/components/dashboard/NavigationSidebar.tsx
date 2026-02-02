"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { getAvatarUrl, getAvatarColor, getAvatarInitial } from "@/utils/avatar";
import { Button } from "@/components/ui/button";
import { websiteConfig } from "@/lib/website-config";
import {
  AGENT_PAGES,
  type NavigationPage,
} from "@/lib/constants/agent-pages";

export type { NavigationPage };

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

  const isAdmin = agent?.role === "admin";

  const handleNavigate = (page: NavigationPage) => {
    onNavigate?.(page);
  };

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

  const avatarColor = getAvatarColor(agent?.username || "");
  const displayInitial = getAvatarInitial(agent?.username || "");
  const fullAvatarUrl = getAvatarUrl(avatarUrl);

  const visiblePages = AGENT_PAGES.filter(
    (p) => !p.adminOnly || (p.adminOnly && isAdmin)
  );

  return (
    <div className="w-16 bg-gray-50 flex flex-col items-center py-4 border-r border-gray-200 h-full">
      {visiblePages.map((page) => {
        const isActive = currentPage === page.id;
        const Icon = page.Icon;
        return (
          <button
            key={page.id}
            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
              isActive
                ? "bg-green-600 hover:bg-green-700"
                : "bg-white border border-gray-200 hover:bg-gray-100"
            }`}
            title={page.title}
            onClick={() => handleNavigate(page.id as NavigationPage)}
          >
            <Icon
              className={`w-6 h-6 ${
                isActive ? "text-white" : "text-gray-600"
              }`}
            />
          </button>
        );
      })}

      {/* 个人资料按钮和 GitHub 按钮（固定在底部） */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="relative" ref={menuRef}>
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

          {profileMenuOpen && (
            <div className="absolute bottom-12 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors p-0"
          title="GitHub"
        >
          <a
            href={websiteConfig.github.repo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </Button>
      </div>
    </div>
  );
}
