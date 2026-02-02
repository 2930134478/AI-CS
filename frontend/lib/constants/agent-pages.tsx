"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  MessageCircle,
  Lightbulb,
  BookOpen,
  ClipboardList,
  Users,
  Settings,
} from "lucide-react";

/** 嵌入在 dashboard 内的页面组件（懒加载） */
const KnowledgePage = dynamic(
  () => import("@/app/agent/knowledge/page").then((mod) => ({ default: mod.default })),
  { ssr: false }
);
const FAQsPage = dynamic(
  () => import("@/app/agent/faqs/page").then((mod) => ({ default: mod.default })),
  { ssr: false }
);
const UsersPage = dynamic(
  () => import("@/app/agent/users/page").then((mod) => ({ default: mod.default })),
  { ssr: false }
);
const SettingsPage = dynamic(
  () => import("@/app/agent/settings/page").then((mod) => ({ default: mod.default })),
  { ssr: false }
);

export interface AgentPageItem {
  id: string;
  label: string;
  title: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
  /** 对话类页面：展示会话列表 + 聊天区，无独立主内容 */
  isChatPage?: boolean;
  /** 非对话类页面的嵌入组件；对话类不填 */
  component?: ComponentType<{ embedded?: boolean }>;
}

/**
 * 客服端侧栏功能页配置（单一数据源）
 * 新增功能：在此数组增加一项即可，无需改 NavigationSidebar / DashboardShell 的罗列逻辑
 */
export const AGENT_PAGES = [
  {
    id: "dashboard",
    label: "对话",
    title: "对话",
    Icon: MessageCircle,
    isChatPage: true,
  },
  {
    id: "internal-chat",
    label: "知识库测试",
    title: "知识库测试",
    Icon: Lightbulb,
    isChatPage: true,
  },
  {
    id: "knowledge",
    label: "知识库",
    title: "知识库",
    Icon: BookOpen,
    component: KnowledgePage,
  },
  {
    id: "faqs",
    label: "事件管理",
    title: "事件管理",
    Icon: ClipboardList,
    component: FAQsPage,
  },
  {
    id: "users",
    label: "用户管理",
    title: "用户管理",
    Icon: Users,
    adminOnly: true,
    component: UsersPage,
  },
  {
    id: "settings",
    label: "AI 配置",
    title: "AI 配置",
    Icon: Settings,
    component: SettingsPage,
  },
] as const;

export type NavigationPage = (typeof AGENT_PAGES)[number]["id"];

const VALID_PAGE_IDS = new Set(AGENT_PAGES.map((p) => p.id));

export function getPageFromSearchParams(searchParams: URLSearchParams | null): NavigationPage {
  const p = searchParams?.get("page") ?? null;
  if (p && VALID_PAGE_IDS.has(p)) return p as NavigationPage;
  return "dashboard";
}

export function getAgentPage(pageId: NavigationPage): AgentPageItem | undefined {
  return AGENT_PAGES.find((p) => p.id === pageId);
}
