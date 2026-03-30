export const PERMISSION_OPTIONS = [
  { key: "chat", label: "对话" },
  { key: "kb_test", label: "知识库测试" },
  { key: "knowledge", label: "知识库" },
  { key: "faqs", label: "事件管理" },
  { key: "analytics", label: "数据报表" },
  { key: "logs", label: "日志中心" },
  { key: "prompts", label: "提示词" },
  { key: "settings", label: "AI 配置" },
  { key: "users", label: "用户管理" },
] as const;

export type PermissionKey = (typeof PERMISSION_OPTIONS)[number]["key"];

export function defaultAgentPermissions(): PermissionKey[] {
  return ["chat"];
}

