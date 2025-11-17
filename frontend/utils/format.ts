export function formatConversationTime(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return "-";
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 3600 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMessageTime(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return "";
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 3600 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildMessagePreview(content: string, maxLength = 50): string {
  if (!content) {
    return "";
  }
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.substring(0, maxLength)}...`;
}

// 判断访客是否在线（根据 last_seen_at 字段）
// 如果 last_seen_at 在最近 10 秒内，则认为在线
export function isVisitorOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) {
    return false;
  }
  const lastSeen = new Date(lastSeenAt);
  if (Number.isNaN(lastSeen.getTime())) {
    return false;
  }
  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();
  // 10 秒内认为在线
  return diff < 10 * 1000;
}

