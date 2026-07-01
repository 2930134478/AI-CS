"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { ResponsiveLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/useToast";
import {
  fetchDocument,
  type Document,
} from "@/features/agent/services/documentApi";
import {
  fetchChunks,
  executeChunking,
  updateChunk,
  deleteChunks,
  type DocumentChunk,
} from "@/features/agent/services/chunkApi";
import {
  ChevronLeft,
  ChevronRight,
  Scissors,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

type ChunkMethod = "char_count" | "separator";

interface DocumentDetailPageProps {
  embedded?: boolean;
  docId?: number;
  onBack?: () => void;
}

export default function DocumentDetailPage(props: DocumentDetailPageProps = {}) {
  const { embedded = false, docId: propDocId, onBack } = props;
  const params = useParams<{ docId?: string }>();
  const router = useRouter();
  useI18n();
  const docIdNum = propDocId ?? Number(params.docId ?? 0);

  const [doc, setDoc] = useState<Document | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState("");

  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunkPage, setChunkPage] = useState(1);
  const [chunkTotalPage, setChunkTotalPage] = useState(1);
  const [chunkTotal, setChunkTotal] = useState(0);
  const pageSize = 10;

  const [method, setMethod] = useState<ChunkMethod>("char_count");
  const [chunkSize, setChunkSize] = useState(500);
  const [separator, setSeparator] = useState("");
  const [executing, setExecuting] = useState(false);

  const [editChunk, setEditChunk] = useState<DocumentChunk | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const loadDoc = useCallback(async () => {
    if (!docIdNum || isNaN(docIdNum)) {
      setDocError("文档 ID 无效");
      setLoadingDoc(false);
      return;
    }
    try {
      setLoadingDoc(true);
      const d = await fetchDocument(docIdNum);
      setDoc(d);
      setDocError("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载文档失败";
      setDocError(msg);
    } finally {
      setLoadingDoc(false);
    }
  }, [docIdNum]);

  const loadChunks = useCallback(async (page: number = 1) => {
    if (!docIdNum || isNaN(docIdNum)) return;
    try {
      setLoadingChunks(true);
      const res = await fetchChunks(docIdNum, page, pageSize);
      setChunks(res.chunks || []);
      setChunkTotalPage(res.total_page || 1);
      setChunkTotal(res.total || 0);
    } catch {
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  }, [docIdNum, pageSize]);

  useEffect(() => {
    loadDoc();
    loadChunks(chunkPage);
  }, [loadDoc, loadChunks, chunkPage]);

  useEffect(() => {
    const hasPending = chunks.some(
      (c) => c.embedding_status === "pending" || c.embedding_status === "processing"
    );
    if (!hasPending) return;
    const timer = setInterval(() => loadChunks(chunkPage), 2500);
    return () => clearInterval(timer);
  }, [chunks, loadChunks, chunkPage]);

  const handleExecute = async () => {
    if (method === "separator" && !separator) {
      toast.error("请输入分隔符");
      return;
    }
    try {
      setExecuting(true);
      const res = await executeChunking(docIdNum, {
        method,
        chunk_size: method === "char_count" ? chunkSize : undefined,
        separator: method === "separator" ? separator : undefined,
      });
      setChunks(res.chunks || []);
      setChunkPage(1);
      toast.success(`分段完成，共 ${res.chunk_count} 段`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "分段失败";
      toast.error(msg);
    } finally {
      setExecuting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteChunks(docIdNum);
      setChunks([]);
      setChunkPage(1);
      setChunkTotalPage(1);
      setChunkTotal(0);
      setShowConfirm(false);
      toast.success("分段已删除");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "删除失败";
      toast.error(msg);
    }
  };

  const openEdit = (chunk: DocumentChunk) => {
    setEditChunk(chunk);
    setEditContent(chunk.content);
  };

  const handleSaveEdit = async () => {
    if (!editChunk || !editContent.trim()) return;
    try {
      setSaving(true);
      await updateChunk(docIdNum, editChunk.id, editContent);
      toast.success("分段已更新，正在重新向量化");
      setEditChunk(null);
      loadChunks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "保存失败";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            已向量化
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            向量化中
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            待向量化
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            向量化失败
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  };

  const headerContent = (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => (onBack ? onBack() : router.back())}
        className="shrink-0"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <div>
        <h1 className="text-lg font-semibold">
          {loadingDoc ? "加载中..." : doc?.title || "文档详情"}
        </h1>
        {doc && (
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Badge variant="secondary">{doc.type}</Badge>
            <Badge
              className={
                doc.status === "published"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {doc.status === "published" ? "已发布" : "草稿"}
            </Badge>
            <span>·</span>
            <span>
              {chunkTotal > 0 ? `${chunkTotal} 个分段` : "未分段"}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const chunkControls = (
    <Card className="p-4">
      <h2 className="font-medium mb-3 flex items-center gap-2">
        <Scissors className="w-4 h-4" />
        分段操作
      </h2>

      <div className="flex gap-2 mb-3">
        <Button
          variant={method === "char_count" ? "default" : "outline"}
          size="sm"
          onClick={() => setMethod("char_count")}
        >
          按字数
        </Button>
        <Button
          variant={method === "separator" ? "default" : "outline"}
          size="sm"
          onClick={() => setMethod("separator")}
        >
          按分隔符
        </Button>
      </div>

      <div className="flex items-end gap-3">
        {method === "char_count" ? (
          <div className="flex-1 max-w-[200px]">
            <label className="text-sm text-muted-foreground mb-1 block">
              每段字数
            </label>
            <Input
              type="number"
              min={100}
              max={10000}
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value) || 500)}
            />
          </div>
        ) : (
          <div className="flex-1 max-w-[300px]">
            <label className="text-sm text-muted-foreground mb-1 block">
              分隔字符
            </label>
            <Input
              placeholder='如：## 或 \n\n'
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
            />
          </div>
        )}
        <Button onClick={handleExecute} disabled={executing}>
          {executing && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          执行分段
        </Button>
        {chunks.length > 0 && (
          <Button
            variant="outline"
            className="text-red-600"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            清除分段
          </Button>
        )}
      </div>
      {chunks.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          执行新分段将自动替换旧分段并重新向量化
        </p>
      )}
    </Card>
  );

  const chunkList = (
    <div className="space-y-3">
      <h2 className="font-medium flex items-center gap-2">
        <FileText className="w-4 h-4" />
        分段列表
        {loadingChunks && <Loader2 className="w-3 h-3 animate-spin" />}
      </h2>

      {chunks.length === 0 && !loadingChunks ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Scissors className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>尚未分段</p>
          <p className="text-sm mt-1">
            选择分段方式并执行，系统将自动为每段生成向量索引
          </p>
        </Card>
      ) : (
        <>
          {chunks.map((chunk) => (
            <Card key={chunk.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      第 {chunk.chunk_index + 1} 段
                    </span>
                    {statusBadge(chunk.embedding_status)}
                    <span className="text-xs text-muted-foreground">
                      {chunk.content.length} 字
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">
                    {truncate(chunk.content, 200)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(chunk)}
                  className="shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
          {chunkTotalPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChunkPage((p) => Math.max(1, p - 1))}
                disabled={chunkPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {chunkPage}/{chunkTotalPage} 页，共 {chunkTotal} 条
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChunkPage((p) => Math.min(chunkTotalPage, p + 1))}
                disabled={chunkPage >= chunkTotalPage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const mainContent = (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      {docError ? (
        <Card className="p-8 text-center text-red-500">
          <p>{docError}</p>
          <Button variant="outline" className="mt-4" onClick={() => (onBack ? onBack() : router.back())}>
            返回
          </Button>
        </Card>
      ) : loadingDoc ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : doc ? (
        <>
          {chunkControls}
          {chunkList}
        </>
      ) : null}
    </div>
  );

  const editDialog = (
    <Dialog
      open={!!editChunk}
      onOpenChange={(open) => {
        if (!open) setEditChunk(null);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            编辑第 {(editChunk?.chunk_index ?? 0) + 1} 段
          </DialogTitle>
          <DialogDescription>
            修改后会自动重新向量化该分段
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={12}
          className="min-h-[200px]"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditChunk(null)}>
            取消
          </Button>
          <Button onClick={handleSaveEdit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const confirmDialog = (
    <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认清除分段</DialogTitle>
          <DialogDescription>
            将删除该文档的所有分段及对应向量索引。此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowConfirm(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            确认清除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (embedded) {
    return (
      <>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 pt-2 pb-1 border-b bg-background">
            {headerContent}
          </div>
          <div className="flex-1 overflow-y-auto">
            {mainContent}
          </div>
        </div>
        {editDialog}
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <ResponsiveLayout
        main={mainContent}
        header={headerContent}
      />
      {editDialog}
      {confirmDialog}
    </>
  );
}
