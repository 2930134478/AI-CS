/**
 * 访客 ID：写入 localStorage，保证为可安全表示的正整数。
 * 旧版 `${Date.now()}${random}` 拼接过长会导致精度问题，此处会迁移为新格式。
 */
export function getOrCreateVisitorId(): number {
  const stored = window.localStorage.getItem("visitor_id");
  if (stored) {
    const parsed = Number.parseInt(stored, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const id = Date.now() * 1000 + Math.floor(Math.random() * 100000);
  window.localStorage.setItem("visitor_id", String(id));
  return id;
}
