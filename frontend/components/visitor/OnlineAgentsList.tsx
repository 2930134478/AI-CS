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
        <span>在线</span>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick?.(agent)}
            className="flex flex-col items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-primary/5 transition-all cursor-pointer group"
            title={agent.nickname}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 group-hover:border-primary/60 transition-all">
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
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[72px]">
              {agent.nickname}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground text-center pt-1">
        有疑问吗？联系我们！
      </p>
    </div>
  );
}

