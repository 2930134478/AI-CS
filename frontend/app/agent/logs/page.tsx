"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteLogMinLevelPolicy,
  fetchLogMinLevelPolicy,
  fetchSystemLogs,
  putLogMinLevelPolicy,
  type LogMinLevelPolicy,
  type QuerySystemLogsResult,
} from "@/features/agent/services/systemLogApi";
import { toast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";

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
  const { t, lang } = useI18n();

  const tr = (key: I18nKey, vars?: Record<string, string>) => {
    let s = t(key);
    if (!vars) return s;
    for (const k of Object.keys(vars)) {
      s = s.replaceAll(`{{${k}}}`, vars[k] ?? "");
    }
    return s;
  };

  const locale = lang === "en" ? "en-US" : "zh-CN";
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
  const [policy, setPolicy] = useState<LogMinLevelPolicy | null>(null);
  const [policyDraft, setPolicyDraft] = useState("info");
  const [policyLoading, setPolicyLoading] = useState(false);

  const selectedMeta = useMemo(() => tryFormatJSON(selected?.meta_json), [selected]);

  const loadPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const p = await fetchLogMinLevelPolicy();
      setPolicy(p);
      setPolicyDraft(p.effective_min_level);
    } catch (e) {
      toast.error((e as Error).message || t("agent.logs.toast.loadPolicyFailed"));
      setPolicy(null);
    } finally {
      setPolicyLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

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
      toast.error((e as Error).message || t("agent.logs.toast.loadLogsFailed"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, level, category, source, event, keyword, conversationId, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.page_size));
  }, [data]);

  return (
    <div
      className={`flex min-h-0 flex-col overflow-auto ${embedded ? "p-3 sm:p-4" : "w-full max-w-6xl p-4 sm:p-6 mx-auto"}`}
    >
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{t("agent.logs.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("agent.logs.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{t("agent.logs.policy.title")}</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">{t("agent.logs.policy.desc")}</p>
            {policy ? (
              <p className="text-xs text-muted-foreground mt-2">
                {t("agent.logs.policy.current")}<span className="font-medium text-foreground">{policy.effective_min_level}</span>
                {" · "}
                {t("agent.logs.policy.env")}<span className="font-medium text-foreground">{policy.env_min_level}</span>
                {policy.persisted_in_database ? (
                  <span className="text-amber-700 dark:text-amber-500">{t("agent.logs.policy.overridden")}</span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={policyDraft}
              onChange={(e) => setPolicyDraft(e.target.value)}
              disabled={policyLoading}
              className="rounded-md border px-2 py-1.5 text-sm min-w-[140px]"
            >
              <option value="debug">debug</option>
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
              <option value="none">none</option>
            </select>
            <Button
              size="sm"
              disabled={policyLoading}
              onClick={async () => {
                setPolicyLoading(true);
                try {
                  await putLogMinLevelPolicy(policyDraft);
                  toast.success("OK");
                  await loadPolicy();
                } catch (e) {
                  toast.error((e as Error).message || t("agent.logs.toast.savePolicyFailed"));
                } finally {
                  setPolicyLoading(false);
                }
              }}
            >
              {t("common.save")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={policyLoading}
              onClick={async () => {
                setPolicyLoading(true);
                try {
                  await deleteLogMinLevelPolicy();
                  toast.success(t("agent.logs.toast.policyRestored"));
                  await loadPolicy();
                } catch (e) {
                  toast.error((e as Error).message || t("agent.logs.toast.restorePolicyFailed"));
                } finally {
                  setPolicyLoading(false);
                }
              }}
            >
              {t("common.restoreEnv")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border px-2 py-1 text-sm" />
        <span className="text-xs text-muted-foreground">{t("common.to")}</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border px-2 py-1 text-sm" />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border px-2 py-1 text-sm">
          <option value="">{t("agent.logs.level.all")}</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border px-2 py-1 text-sm">
          <option value="">{t("agent.logs.category.all")}</option>
          <option value="ai">ai</option>
          <option value="rag">rag</option>
          <option value="frontend">frontend</option>
          <option value="system">system</option>
          <option value="business">business</option>
          <option value="http">http</option>
          <option value="vector">vector</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-md border px-2 py-1 text-sm">
          <option value="">{t("agent.logs.source.all")}</option>
          <option value="backend">backend</option>
          <option value="frontend">frontend</option>
        </select>
        <input
          placeholder={t("agent.logs.event.placeholder")}
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm min-w-[180px]"
        />
        <input
          placeholder={t("agent.logs.conversationId.placeholder")}
          value={conversationId}
          onChange={(e) => setConversationId(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm w-24"
        />
        <input
          placeholder={t("agent.logs.keyword.placeholder")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm min-w-[220px]"
        />
        <Button size="sm" disabled={loading} onClick={() => { setPage(1); void load(); }}>
          {loading ? t("common.loading") : t("common.search")}
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="border-b px-3 py-2 text-xs text-muted-foreground">
          {tr("agent.logs.paginationSummary", {
            total: String(data?.total ?? 0),
            page: String(data?.page ?? page),
            pages: String(totalPages),
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">{t("agent.logs.table.time")}</th>
                <th className="text-left px-3 py-2">{t("agent.logs.table.level")}</th>
                <th className="text-left px-3 py-2">{t("agent.logs.table.category")}</th>
                <th className="text-left px-3 py-2">{t("agent.logs.table.event")}</th>
                <th className="text-left px-3 py-2">{t("agent.logs.table.conversation")}</th>
                <th className="text-left px-3 py-2">{t("agent.logs.table.source")}</th>
                <th className="text-left px-3 py-2">{t("agent.logs.table.message")}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((item) => (
                <tr
                  key={item.id}
                  className="border-t cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelected(item)}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {new Date(item.timestamp).toLocaleString(locale)}
                  </td>
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
                  <td className="px-3 py-8 text-center text-muted-foreground" colSpan={7}>
                    {t("agent.logs.empty")}
                  </td>
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
            {t("common.prevPage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("common.nextPage")}
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
              <span>{t("agent.logs.detail.title")}</span>
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
                  <div className="text-xs text-muted-foreground">{t("agent.logs.detail.time")}</div>
                  <div className="font-medium">
                    {new Date(selected.timestamp).toLocaleString(locale)}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">{t("agent.logs.detail.sourceEvent")}</div>
                  <div className="font-medium">
                    {selected.source} / {selected.event}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">{t("agent.logs.detail.category")}</div>
                  <div className="font-medium">{selected.category}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">{t("agent.logs.detail.traceId")}</div>
                  <div className="font-medium break-all">{selected.trace_id || "-"}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">{t("agent.logs.detail.conversationId")}</div>
                  <div className="font-medium">{selected.conversation_id ?? "-"}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">{t("agent.logs.detail.userVisitor")}</div>
                  <div className="font-medium">
                    {selected.user_id ?? "-"} / {selected.visitor_id ?? "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-medium">{t("agent.logs.detail.message")}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selected.message);
                        toast.success(t("agent.logs.toast.messageCopied"));
                      } catch {
                        toast.error(t("agent.logs.toast.copyFailed"));
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {t("common.copy")}
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded p-2 max-h-48 overflow-auto">{selected.message}</pre>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-2">{t("agent.logs.detail.metaJson")}</div>
                <pre className="whitespace-pre-wrap text-xs bg-muted/30 rounded p-2 max-h-80 overflow-auto">
                  {selectedMeta || t("agent.logs.detail.noMeta")}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

