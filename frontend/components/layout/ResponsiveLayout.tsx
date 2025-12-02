"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { LAYOUT } from "@/lib/constants/breakpoints";

/**
 * ResponsiveLayout - 响应式布局组件
 * 
 * 提供统一的响应式布局，支持桌面端和移动端自适应。
 * 
 * @example
 * ```tsx
 * <ResponsiveLayout
 *   sidebar={<ConversationSidebar />}
 *   main={<MessageList />}
 *   rightPanel={<VisitorDetailPanel />}
 * />
 * ```
 * 
 * @param sidebar - 侧边栏内容（桌面端显示，移动端可折叠）
 * @param main - 主内容区（所有设备都显示）
 * @param rightPanel - 右侧面板（大屏幕显示，小屏幕隐藏或折叠）
 * @param header - 顶部栏（可选）
 * @param className - 额外的 CSS 类名
 */
export interface ResponsiveLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  rightPanel?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  sidebarWidth?: string; // 侧边栏宽度（可选，默认使用 LAYOUT.sidebarWidth）
}

export function ResponsiveLayout({
  sidebar,
  main,
  rightPanel,
  header,
  className,
  sidebarWidth,
}: ResponsiveLayoutProps) {
  const actualSidebarWidth = sidebarWidth || LAYOUT.sidebarWidth;
  
  return (
    <div className={`flex h-screen bg-background overflow-hidden ${className || ""}`}>
      {/* 桌面端侧边栏：中等屏幕及以上显示 */}
      {sidebar && (
        <aside className={`hidden md:block border-r bg-background flex-shrink-0`} style={{ width: actualSidebarWidth }}>
          {sidebar}
        </aside>
      )}

      {/* 移动端侧边栏：使用 Sheet 组件实现可折叠侧边栏 */}
      {sidebar && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0" style={{ width: actualSidebarWidth }}>
            {sidebar}
          </SheetContent>
        </Sheet>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* 顶部栏（如果提供） */}
        {header && (
          <header className="flex-shrink-0 border-b bg-background">
            {header}
          </header>
        )}

        {/* 主内容区和右侧面板容器 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 主内容区 */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {main}
          </main>

          {/* 右侧面板：大屏幕显示，小屏幕隐藏 */}
          {rightPanel && (
            <>
              <aside className={`hidden lg:block border-l bg-background flex-shrink-0`} style={{ width: LAYOUT.rightPanelWidth }}>
                {rightPanel}
              </aside>
              {/* 移动端右侧面板：使用 Sheet 组件实现可折叠面板 */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="fixed top-4 right-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm"
                  >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">打开详情</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0" style={{ width: LAYOUT.rightPanelWidth }}>
                  {rightPanel}
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

