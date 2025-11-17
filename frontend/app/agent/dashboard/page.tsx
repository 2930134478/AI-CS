import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function AgentDashboardPage() {
  // 页面采用纯客户端渲染，所有业务逻辑由 DashboardShell 承担
  return <DashboardShell />;
}

