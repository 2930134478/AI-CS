import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function AgentDashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-background"><div className="text-muted-foreground">加载中...</div></div>}>
      <DashboardShell />
    </Suspense>
  );
}

