import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardSuspenseFallback } from "@/components/dashboard/DashboardSuspenseFallback";

export default function AgentDashboardPage() {
  return (
    <Suspense fallback={<DashboardSuspenseFallback />}>
      <DashboardShell />
    </Suspense>
  );
}

