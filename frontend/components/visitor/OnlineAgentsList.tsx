"use client";

import Image from "next/image";
import { getAvatarUrl } from "@/utils/avatar";

export interface OnlineAgent {
  id: number;
  nickname: string;
  avatar_url: string;
}

interface OnlineAgentsListProps {
  agents: OnlineAgent[];
  onAgentClick?: (agent: OnlineAgent) => void;
}

/**
 * 在线客服列表组件
 * 显示在线客服的头像和昵称
 */
export function OnlineAgentsList({
  agents,
  onAgentClick,
}: OnlineAgentsListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        暂无在线客服
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-foreground mb-3 text-center flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>在线客服 ({agents.length})</span>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick?.(agent)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-primary/5 hover:shadow-md transition-all cursor-pointer group border border-transparent hover:border-primary/20"
            title={agent.nickname}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 group-hover:border-primary/60 transition-all shadow-sm group-hover:shadow-md">
              {getAvatarUrl(agent.avatar_url) ? (
                <Image
                  src={getAvatarUrl(agent.avatar_url)!}
                  alt={agent.nickname}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-base font-semibold">
                  {agent.nickname.charAt(0).toUpperCase()}
                </div>
              )}
              {/* 在线状态指示器 */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[70px]">
              {agent.nickname}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

