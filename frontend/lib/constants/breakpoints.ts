/**
 * 响应式设计断点常量
 * 用于统一管理响应式断点，确保所有页面使用一致的断点
 */

export const BREAKPOINTS = {
  /** 小屏幕（大手机）：640px */
  sm: '640px',
  /** 中等屏幕（平板）：768px */
  md: '768px',
  /** 大屏幕（小桌面）：1024px */
  lg: '1024px',
  /** 超大屏幕（大桌面）：1280px */
  xl: '1280px',
  /** 超超大屏幕（超大桌面）：1536px */
  '2xl': '1536px',
} as const;

/**
 * 布局尺寸常量
 * 用于统一管理布局尺寸，确保所有页面使用一致的尺寸
 */
export const LAYOUT = {
  /** 导航栏宽度：64px (4rem) */
  navigationWidth: '4rem',
  /** 侧边栏宽度：320px (20rem) */
  sidebarWidth: '20rem',
  /** 对话页侧边栏总宽度：导航 4rem + 对话列表 20rem = 24rem */
  dashboardSidebarWidth: '24rem',
  /** 右侧面板宽度：320px (20rem) */
  rightPanelWidth: '20rem',
  /** 顶部栏高度：64px (4rem) */
  headerHeight: '4rem',
} as const;

