import { useEffect } from "react";
import { updateFaviconWithBadge, updateFavicon, DEFAULT_FAVICON } from "@/utils/favicon";

/**
 * 根据未读数更新页面标题和 favicon 红色数字徽章
 * @param unreadCount 未读消息数
 * @param baseTitle 基础标题（如 "AI-CS"），未读 > 0 时标题为 "(n) baseTitle"
 */
export function usePageTitle(unreadCount: number, baseTitle: string) {
  useEffect(() => {
    const title = unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;
    document.title = title;

    if (unreadCount > 0) {
      // 延迟更新 favicon，保证首屏或切回标签时也能刷到
      const t = setTimeout(() => {
        updateFaviconWithBadge(unreadCount);
      }, 100);
      return () => clearTimeout(t);
    } else {
      updateFavicon(DEFAULT_FAVICON);
    }
  }, [unreadCount, baseTitle]);
}
