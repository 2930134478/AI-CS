"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, PanelRight } from "lucide-react";
import { LAYOUT } from "@/lib/constants/breakpoints";
import { useI18n } from "@/lib/i18n/provider";

/**
 * ResponsiveLayout - 响应式布局组件
 *
 * 提供统一的响应式布局，支持桌面端和移动端自适应。
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
  sidebarWidth?: string;
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
  const { t } = useI18n();

  /** 与顶部安全区对齐；与 ChatHeader（h-16）上圆钮视觉对齐 */
  const mobileFabTop =
    "top-[max(0.75rem,env(safe-area-inset-top,0px)+0.25rem)]";

  return (
    <div
      className={`flex h-[100dvh] max-h-[100dvh] bg-background overflow-hidden ${className || ""}`}
    >
      {sidebar && (
        <aside
          className="hidden md:block border-r bg-background flex-shrink-0"
          style={{ width: actualSidebarWidth }}
        >
          {sidebar}
        </aside>
      )}

      {sidebar && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`fixed left-3 z-50 md:hidden h-10 w-10 rounded-full border-border/80 bg-background/90 shadow-sm backdrop-blur-sm ${mobileFabTop}`}
              aria-label={t("agent.layout.openNavMenu")}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(100vw-2rem,24rem)] max-w-[24rem] p-0"
            style={{ width: actualSidebarWidth }}
          >
            {sidebar}
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {header && (
          <header className="flex-shrink-0 border-b bg-background">{header}</header>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">{main}</main>

          {rightPanel && (
            <>
              <aside
                className="hidden lg:block border-l bg-background flex-shrink-0"
                style={{ width: LAYOUT.rightPanelWidth }}
              >
                {rightPanel}
              </aside>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`fixed right-3 z-50 lg:hidden h-10 w-10 rounded-full border-border/80 bg-background/90 shadow-sm backdrop-blur-sm ${mobileFabTop}`}
                    aria-label={t("agent.layout.openVisitorPanel")}
                  >
                    <PanelRight className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[min(100vw-2rem,20rem)] max-w-[20rem] p-0"
                  style={{ width: LAYOUT.rightPanelWidth }}
                >
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
