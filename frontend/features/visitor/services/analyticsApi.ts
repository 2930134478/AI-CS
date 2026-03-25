import { apiUrl } from "@/lib/config";

/** 访客打开客服小窗时上报（用于统计访问次数） */
export async function postWidgetOpen(visitorId: number): Promise<void> {
  const res = await fetch(apiUrl("/visitor/analytics/widget-open"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitor_id: visitorId }),
  });
  if (!res.ok) {
    // 埋点失败不阻断用户
    console.warn("widget-open 上报失败", res.status);
  }
}
