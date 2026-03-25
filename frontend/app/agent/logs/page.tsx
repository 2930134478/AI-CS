"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchSystemLogs, type QuerySystemLogsResult } from "@/features/agent/services/systemLogApi";
import { toast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";

function tryFormatJSON(raw?: string | null): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

function levelColor(level: string): string {
  if (level === "error") return "text-red-600";
  if (level === "warn") return "text-amber-600";
  return "text-emerald-600";
}

export default function LogsPage({ embedded = false }: { embedded?: boolean }) {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [event, setEvent] = useState("");
  const [keyword, setKeyword] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [data, setData] = useState<QuerySystemLogsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [selected, setSelected] = useState<(QuerySystemLogsResult["items"][number]) | null>(null);

  const selectedMeta = useMemo(() => tryFormatJSON(selected?.meta_json), [selected]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const conv = conversationId.trim() ? Number(conversationId) : undefined;
      const res = await fetchSystemLogs({
        from,
        to,
        level: level || undefined,
        category: category || undefined,
        source: source || undefined,
        event: event || undefined,
        keyword: keyword || undefined,
        conversationId: conv,
        page,
        pageSize,
      });
      setData(res);
    } catch (e) {
      toast.error((e as Error).message || "加载日志失败");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, level, category, source, event, keyword, conversationId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.page_size));
  }, [data]);

  return (
    <div className={`flex flex-col min-h-0 overflow-auto ${embedded ? "p-4" : "p-6 max-w-6xl mx-auto w-full"}`}>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">日志中心</h1>
        <p className="text-sm text-muted-foreground mt-1">按分类查看 AI / RAG / 系统 / 前端日志，用于排障定位。</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border px-2 py-1 text-sm" />
        <span className="text-xs text-muted-foreground">到</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border px-2 py-1 text-sm" />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border px-2 py-1 text-sm">
          <option value="">全部级别</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border px-2 py-1 text-sm">
          <option value="">全部分类</option>
          <option value="ai">ai</option>
          <option value="rag">rag</option>
          <option value="frontend">frontend</option>
          <option value="system">system</option>
          <option value="business">business</option>
          <option value="http">http</option>
          <option value="vector">vector</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-md border px-2 py-1 text-sm">
          <option value="">全部来源</option>
          <option value="backend">backend</option>
          <option value="frontend">frontend</option>
        </select>
        <input
          placeholder="事件名(event)"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm min-w-[180px]"
        />
        <input
          placeholder="会话ID"
          value={conversationId}
          onChange={(e) => setConversationId(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm w-24"
        />
        <input
          placeholder="关键词（message/meta）"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm min-w-[220px]"
        />
        <Button size="sm" disabled={loading} onClick={() => { setPage(1); void load(); }}>
          {loading ? "加载中..." : "查询"}
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-3 py-2 border-b text-xs text-muted-foreground">
          共 {data?.total ?? 0} 条，当前第 {data?.page ?? page}/{totalPages} 页
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">时间</th>
                <th className="text-left px-3 py-2">级别</th>
                <th className="text-left px-3 py-2">分类</th>
                <th className="text-left px-3 py-2">事件</th>
                <th className="text-left px-3 py-2">会话</th>
                <th className="text-left px-3 py-2">来源</th>
                <th className="text-left px-3 py-2">消息</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((item) => (
                <tr
                  key={item.id}
                  className="border-t cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelected(item)}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className={`px-3 py-2 font-medium ${levelColor(item.level)}`}>{item.level}</td>
                  <td className="px-3 py-2">{item.category}</td>
                  <td className="px-3 py-2">{item.event}</td>
                  <td className="px-3 py-2">{item.conversation_id ?? "-"}</td>
                  <td className="px-3 py-2">{item.source}</td>
                  <td className="px-3 py-2 max-w-[560px] truncate" title={item.message}>{item.message}</td>
                </tr>
              ))}
              {(data?.items ?? []).length === 0 && !loading && (
                <tr>
                  <td className="px-3 py-8 text-center text-muted-foreground" colSpan={7}>暂无日志</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>日志详情</span>
              {selected ? (
                <span className={`text-xs px-2 py-0.5 rounded border ${selected.level === "error" ? "border-red-200 text-red-700" : selected.level === "warn" ? "border-amber-200 text-amber-700" : "border-emerald-200 text-emerald-700"}`}>
                  {selected.level}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">时间</div>
                  <div className="font-medium">{new Date(selected.timestamp).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">source / event</div>
                  <div className="font-medium">
                    {selected.source} / {selected.event}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">category</div>
                  <div className="font-medium">{selected.category}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">trace_id</div>
                  <div className="font-medium break-all">{selected.trace_id || "-"}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">conversation_id</div>
                  <div className="font-medium">{selected.conversation_id ?? "-"}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">user_id / visitor_id</div>
                  <div className="font-medium">
                    {selected.user_id ?? "-"} / {selected.visitor_id ?? "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-medium">message</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selected.message);
                        toast.success("已复制 message");
                      } catch {
                        toast.error("复制失败");
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded p-2 max-h-48 overflow-auto">{selected.message}</pre>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-2">meta_json</div>
                <pre className="whitespace-pre-wrap text-xs bg-muted/30 rounded p-2 max-h-80 overflow-auto">
                  {selectedMeta || "（无 meta_json）"}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

