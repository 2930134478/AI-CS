/**
 * 访客 /chat 是否处于「被宿主 iframe 嵌入」模式。
 * 嵌入时不展示页内 FloatingButton，直接铺满 iframe 显示 ChatWidget。
 */
export function isChatEmbedMode(): boolean {
  if (typeof window === "undefined") return false;

  const q = new URLSearchParams(window.location.search);
  if (q.get("embed") === "1" || q.get("embed") === "true") return true;

  try {
    return window.self !== window.top;
  } catch {
    // 跨域 iframe 访问 top 会抛错，说明正在被外部站点嵌入
    return true;
  }
}
