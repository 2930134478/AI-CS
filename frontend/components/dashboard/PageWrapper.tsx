"use client";

import { ReactNode } from "react";

/**
 * 页面包装组件
 * 用于在 DashboardShell 中显示其他页面内容，去掉 ResponsiveLayout 包装
 */
interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {children}
    </div>
  );
}

