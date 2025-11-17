"use client";

import { getAvatarUrl, getAvatarColor, getAvatarInitial } from "@/utils/avatar";

interface DashboardHeaderProps {
  username: string;
  role: string;
  avatarUrl?: string | null;
  onLogout: () => void;
  onProfileClick: () => void;
}

export function DashboardHeader({
  username,
  role,
  avatarUrl,
  onLogout,
  onProfileClick,
}: DashboardHeaderProps) {
  // 根据用户名生成头像颜色（如果没有上传头像）
  const avatarColor = getAvatarColor(username);
  const displayInitial = getAvatarInitial(username);
  const fullAvatarUrl = getAvatarUrl(avatarUrl);

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* 头像 */}
        <button
          onClick={onProfileClick}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          title="点击查看个人资料"
        >
          {fullAvatarUrl ? (
            <img
              src={fullAvatarUrl}
              alt={username}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold border-2 border-gray-200"
              style={{ backgroundColor: avatarColor }}
            >
              {displayInitial}
            </div>
          )}
        </button>
        <div>
          <div className="text-sm text-gray-500">当前账号</div>
          <div className="text-base font-semibold text-gray-800">
            {username || "客服"}
            {role ? `（${role}）` : ""}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onProfileClick}
          className="px-3 py-1.5 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          title="个人资料"
        >
          设置
        </button>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}

