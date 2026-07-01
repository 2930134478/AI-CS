const STORAGE_PREFIX = "visitor_access_token_";
const EMAIL_PREFIX = "visitor_contact_email_";
const EMAIL_PROMPT_DONE_PREFIX = "visitor_email_prompt_done_";

export function saveVisitorContactEmail(visitorId: number, email: string): void {
  if (typeof window === "undefined" || !visitorId || !email.trim()) {
    return;
  }
  window.localStorage.setItem(`${EMAIL_PREFIX}${visitorId}`, email.trim());
}

export function getVisitorContactEmail(visitorId: number): string | null {
  if (typeof window === "undefined" || !visitorId) {
    return null;
  }
  return window.localStorage.getItem(`${EMAIL_PREFIX}${visitorId}`);
}

/** 标记邮箱采集提示已完成（已填邮箱或已发过首条消息），清除浏览器缓存前不再展示 */
export function saveVisitorEmailPromptDone(visitorId: number): void {
  if (typeof window === "undefined" || !visitorId) return;
  window.localStorage.setItem(`${EMAIL_PROMPT_DONE_PREFIX}${visitorId}`, "1");
}

export function isVisitorEmailPromptDone(visitorId: number): boolean {
  if (typeof window === "undefined" || !visitorId) return false;
  return window.localStorage.getItem(`${EMAIL_PROMPT_DONE_PREFIX}${visitorId}`) === "1";
}

/** 是否还需要展示邮箱采集行（无已存邮箱且未完成采集流程） */
export function shouldShowVisitorEmailPrompt(visitorId: number): boolean {
  if (!visitorId) return true;
  if (getVisitorContactEmail(visitorId)) return false;
  if (isVisitorEmailPromptDone(visitorId)) return false;
  return true;
}

export function saveVisitorAccessToken(conversationId: number, token: string): void {
  if (typeof window === "undefined" || !conversationId || !token) {
    return;
  }
  window.localStorage.setItem(`${STORAGE_PREFIX}${conversationId}`, token);
}

export function getVisitorAccessToken(conversationId: number): string | null {
  if (typeof window === "undefined" || !conversationId) {
    return null;
  }
  return window.localStorage.getItem(`${STORAGE_PREFIX}${conversationId}`);
}

export function clearVisitorAccessToken(conversationId: number): void {
  if (typeof window === "undefined" || !conversationId) {
    return;
  }
  window.localStorage.removeItem(`${STORAGE_PREFIX}${conversationId}`);
}

/** 访客会话 API 请求头（携带 access_token） */
export function getVisitorConversationHeaders(
  conversationId: number,
  accessToken?: string | null
): Record<string, string> {
  const token = accessToken ?? getVisitorAccessToken(conversationId);
  if (!token) {
    return {};
  }
  return { "X-Conversation-Token": token };
}
