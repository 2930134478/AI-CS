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
  FileText,
  BarChart3,
  ScrollText,
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
const PromptsPage = dynamic(
  () => import("@/app/agent/prompts/page").then((mod) => ({ default: mod.default })),
  { ssr: false }
);
const AnalyticsPage = dynamic(
  () => import("@/app/agent/analytics/page").then((mod) => ({ default: mod.default })),
  { ssr: false }
);
const LogsPage = dynamic(
  () => import("@/app/agent/logs/page").then((mod) => ({ default: mod.default })),
  { ssr: false }
);

export interface AgentPageItem {
  id: string;
  label: string;
  title: string;
  /** i18n：title 对应的 key（可选，未接入时回退 title） */
  titleKey?: import("@/lib/i18n/dict").I18nKey;
  Icon: LucideIcon;
  /** 需要的功能权限键（单级开关）。admin 视为全权限 */
  requiredPermission?: string;
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
    label: "会话对话",
    title: "对话",
    titleKey: "agent.page.dashboard",
    Icon: MessageCircle,
    requiredPermission: "chat",
    isChatPage: true,
  },
  {
    id: "internal-chat",
    label: "知识测试",
    title: "知识库测试",
    titleKey: "agent.page.internalChat",
    Icon: Lightbulb,
    requiredPermission: "kb_test",
    isChatPage: true,
  },
  {
    id: "knowledge",
    label: "知识管理",
    title: "知识库",
    titleKey: "agent.page.knowledge",
    Icon: BookOpen,
    requiredPermission: "knowledge",
    component: KnowledgePage,
  },
  {
    id: "faqs",
    label: "事件管理",
    title: "事件管理",
    titleKey: "agent.page.faqs",
    Icon: ClipboardList,
    requiredPermission: "faqs",
    component: FAQsPage,
  },
  {
    id: "analytics",
    label: "数据报表",
    title: "数据报表",
    titleKey: "agent.page.analytics",
    Icon: BarChart3,
    requiredPermission: "analytics",
    component: AnalyticsPage,
  },
  {
    id: "logs",
    label: "日志中心",
    title: "日志中心",
    titleKey: "agent.page.logs",
    Icon: ScrollText,
    requiredPermission: "logs",
    component: LogsPage,
  },
  {
    id: "users",
    label: "用户管理",
    title: "用户管理",
    titleKey: "agent.page.users",
    Icon: Users,
    requiredPermission: "users",
    component: UsersPage,
  },
  {
    id: "prompts",
    label: "提示配置",
    title: "提示词",
    titleKey: "agent.page.prompts",
    Icon: FileText,
    requiredPermission: "prompts",
    component: PromptsPage,
  },
  {
    id: "settings",
    label: "AI配置",
    title: "AI 配置",
    titleKey: "agent.page.settings",
    Icon: Settings,
    requiredPermission: "settings",
    component: SettingsPage,
  },
] as const;

export type NavigationPage = (typeof AGENT_PAGES)[number]["id"];

const VALID_PAGE_IDS = new Set<string>(AGENT_PAGES.map((p) => p.id));

export function getPageFromSearchParams(searchParams: URLSearchParams | null): NavigationPage {
  const p = searchParams?.get("page") ?? null;
  if (p != null && VALID_PAGE_IDS.has(p)) return p as NavigationPage;
  return "dashboard";
}

export function getAgentPage(pageId: NavigationPage): AgentPageItem | undefined {
  return AGENT_PAGES.find((p) => p.id === pageId);
}
