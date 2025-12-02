"use client";

import { getAvatarUrl, getAvatarColor, getAvatarInitial } from "@/utils/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="h-16 flex items-center justify-between px-6 bg-background flex-shrink-0 relative">
      <div className="flex items-center gap-3 z-10">
        <div>
          <div className="text-sm text-muted-foreground">当前账号</div>
          <div className="text-base font-semibold text-foreground">
            {username || "客服"}
            {role ? `（${role}）` : ""}
          </div>
        </div>
      </div>
      <Separator className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}

