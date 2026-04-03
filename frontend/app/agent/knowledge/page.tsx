"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout";
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import {
  fetchKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  updateKnowledgeBaseRAGEnabled,
  deleteKnowledgeBase,
  type KnowledgeBase,
  type CreateKnowledgeBaseRequest,
  type UpdateKnowledgeBaseRequest,
} from "@/features/agent/services/knowledgeBaseApi";
import {
  fetchDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  publishDocument,
  unpublishDocument,
  type Document,
  type CreateDocumentRequest,
  type UpdateDocumentRequest,
  type DocumentListResult,
} from "@/features/agent/services/documentApi";
import {
  importDocuments,
  importFromUrls,
  type ImportResult,
} from "@/features/agent/services/importApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  Upload,
  Link as LinkIcon,
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/useToast";

export default function KnowledgePage(props: any = {}) {
  const { embedded = false } = props;
  const router = useRouter();
  const { agent } = useAuth();
  const { t, lang } = useI18n();

  const tr = (key: I18nKey, vars?: Record<string, string>) => {
    let s = t(key);
    if (!vars) return s;
    for (const k of Object.keys(vars)) {
      s = s.replaceAll(`{{${k}}}`, vars[k] ?? "");
    }
    return s;
  };

  // 知识库状态
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [loadingKBs, setLoadingKBs] = useState(true);

  // 文档状态
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentResult, setDocumentResult] = useState<DocumentListResult | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 对话框状态
  const [createKBDialogOpen, setCreateKBDialogOpen] = useState(false);
  const [editKBDialogOpen, setEditKBDialogOpen] = useState(false);
  const [deleteKBDialogOpen, setDeleteKBDialogOpen] = useState(false);
  const [createDocDialogOpen, setCreateDocDialogOpen] = useState(false);
  const [editDocDialogOpen, setEditDocDialogOpen] = useState(false);
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "url">("file");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // 表单状态
  const [submitting, setSubmitting] = useState(false);
  const [createKBForm, setCreateKBForm] = useState<CreateKnowledgeBaseRequest>({
    name: "",
    description: "",
  });
  const [editKBForm, setEditKBForm] = useState<UpdateKnowledgeBaseRequest>({});
  const [createDocForm, setCreateDocForm] = useState<CreateDocumentRequest>({
    knowledge_base_id: 0,
    title: "",
    content: "",
    summary: "",
    type: "document",
    status: "draft",
  });
  const [editDocForm, setEditDocForm] = useState<UpdateDocumentRequest>({});
  const [importUrls, setImportUrls] = useState<string>("");
  const [importFiles, setImportFiles] = useState<File[]>([]);

  // 加载知识库列表（不依赖 selectedKnowledgeBase，避免选中后反复触发 effect 导致疯狂刷新）
  const loadKnowledgeBases = useCallback(async () => {
    setLoadingKBs(true);
    try {
      const data = await fetchKnowledgeBases();
      setKnowledgeBases(data);
    } catch (error) {
      console.error("加载知识库列表失败:", error);
      toast.error((error as Error).message || t("agent.knowledge.toast.loadKbFailed"));
    } finally {
      setLoadingKBs(false);
    }
  }, [t]);

  // 加载文档列表（silent：后台轮询向量化状态时不全屏“加载中”、不弹 Toast，避免刷屏）
  const loadDocuments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!selectedKnowledgeBase) {
        setDocuments([]);
        setDocumentResult(null);
        return;
      }

      const silent = opts?.silent === true;
      if (!silent) {
        setLoadingDocs(true);
      }
      try {
        const status = statusFilter === "all" ? undefined : statusFilter;
        const result = await fetchDocuments(
          selectedKnowledgeBase.id,
          currentPage,
          pageSize,
          searchKeyword || undefined,
          status
        );
        setDocumentResult(result);
        setDocuments(result.documents ?? []);
      } catch (error) {
        console.error("加载文档列表失败:", error);
        if (!silent) {
          toast.error((error as Error).message || t("agent.knowledge.toast.loadDocFailed"));
          setDocuments([]);
          setDocumentResult(null);
        }
      } finally {
        if (!silent) {
          setLoadingDocs(false);
        }
      }
    },
    [selectedKnowledgeBase, currentPage, searchKeyword, statusFilter, t]
  );

  // 初始加载
  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  // 当选择知识库或搜索条件变化时，重新加载文档
  useEffect(() => {
    setCurrentPage(1); // 切换知识库或搜索时重置页码
    void loadDocuments();
  }, [loadDocuments]);

  // 向量化进行中时自动刷新列表（pending → processing → completed/failed），无需手动整页刷新
  useEffect(() => {
    if (!selectedKnowledgeBase) return;
    const hasEmbeddingInFlight = documents.some(
      (d) => d.embedding_status === "pending" || d.embedding_status === "processing"
    );
    if (!hasEmbeddingInFlight) return;

    const intervalMs = 2500;
    const id = window.setInterval(() => {
      void loadDocuments({ silent: true });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [selectedKnowledgeBase, documents, loadDocuments]);

  // 选择知识库
  const handleSelectKnowledgeBase = (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb);
    setSearchKeyword("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // 创建知识库
  const handleCreateKB = async () => {
    if (!createKBForm.name.trim()) {
      toast.error(t("agent.knowledge.toast.kbNameRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createKnowledgeBase(createKBForm);
      setCreateKBDialogOpen(false);
      setCreateKBForm({ name: "", description: "" });
      await loadKnowledgeBases();
      toast.success(t("agent.knowledge.toast.createSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.createKbFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑知识库对话框
  const handleOpenEditKB = (kb: KnowledgeBase) => {
    setEditKBForm({
      name: kb.name,
      description: kb.description,
    });
    setSelectedKnowledgeBase(kb);
    setEditKBDialogOpen(true);
  };

  // 更新知识库
  const handleUpdateKB = async () => {
    if (!selectedKnowledgeBase) return;
    setSubmitting(true);
    try {
      await updateKnowledgeBase(selectedKnowledgeBase.id, editKBForm);
      setEditKBDialogOpen(false);
      await loadKnowledgeBases();
      toast.success(t("agent.knowledge.toast.updateSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.updateKbFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除知识库对话框
  const handleOpenDeleteKB = (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb);
    setDeleteKBDialogOpen(true);
  };

  // 删除知识库
  const handleDeleteKB = async () => {
    if (!selectedKnowledgeBase) return;
    setSubmitting(true);
    try {
      await deleteKnowledgeBase(selectedKnowledgeBase.id);
      setDeleteKBDialogOpen(false);
      setSelectedKnowledgeBase(null);
      await loadKnowledgeBases();
      toast.success(t("agent.knowledge.toast.deleteSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.deleteKbFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开创建文档对话框
  const handleOpenCreateDoc = () => {
    if (!selectedKnowledgeBase) {
      toast.error(t("agent.knowledge.toast.selectKbFirst"));
      return;
    }
    setCreateDocForm({
      knowledge_base_id: selectedKnowledgeBase.id,
      title: "",
      content: "",
      summary: "",
      type: "document",
      status: "draft",
    });
    setCreateDocDialogOpen(true);
  };

  // 创建文档
  const handleCreateDoc = async () => {
    if (!createDocForm.title.trim() || !createDocForm.content.trim()) {
      toast.error(t("agent.knowledge.toast.docTitleContentRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createDocument(createDocForm);
      setCreateDocDialogOpen(false);
      setCreateDocForm({
        knowledge_base_id: selectedKnowledgeBase?.id || 0,
        title: "",
        content: "",
        summary: "",
        type: "document",
        status: "draft",
      });
      await loadDocuments();
      toast.success(t("agent.knowledge.toast.createSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.createDocFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑文档对话框
  const handleOpenEditDoc = (doc: Document) => {
    setSelectedDocument(doc);
    setEditDocForm({
      title: doc.title,
      content: doc.content,
      summary: doc.summary,
      type: doc.type,
      status: doc.status,
    });
    setEditDocDialogOpen(true);
  };

  // 更新文档
  const handleUpdateDoc = async (docId: number) => {
    setSubmitting(true);
    try {
      await updateDocument(docId, editDocForm);
      setEditDocDialogOpen(false);
      await loadDocuments();
      toast.success(t("agent.knowledge.toast.updateSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.updateDocFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除文档对话框
  const handleOpenDeleteDoc = (doc: Document) => {
    setSelectedDocument(doc);
    setDeleteDocDialogOpen(true);
  };

  // 删除文档
  const handleDeleteDoc = async (docId: number) => {
    setSubmitting(true);
    try {
      await deleteDocument(docId);
      setDeleteDocDialogOpen(false);
      await loadDocuments();
      toast.success(t("agent.knowledge.toast.deleteSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.deleteDocFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 发布文档
  const handlePublishDoc = async (docId: number) => {
    try {
      await publishDocument(docId);
      await loadDocuments();
      toast.success(t("agent.knowledge.toast.publishSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.publishFailed"));
    }
  };

  // 取消发布文档
  const handleUnpublishDoc = async (docId: number) => {
    try {
      await unpublishDocument(docId);
      await loadDocuments();
      toast.success(t("agent.knowledge.toast.unpublishSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.unpublishFailed"));
    }
  };

  // 导入文件
  const handleImportFiles = async () => {
    if (!selectedKnowledgeBase) {
      toast.error(t("agent.knowledge.toast.selectKbFirst"));
      return;
    }
    if (importFiles.length === 0) {
      toast.error(t("agent.knowledge.toast.selectFiles"));
      return;
    }
    setSubmitting(true);
    try {
      const result: ImportResult = await importDocuments(selectedKnowledgeBase.id, importFiles);
      const errMsg = result.errors?.length ? result.errors[0] : "";
      if (result.failed_count > 0 && result.success_count === 0) {
        toast.error(
          errMsg ||
            tr("agent.knowledge.toast.importFailed.files", {
              count: String(result.failed_count),
            })
        );
      } else if (result.failed_count > 0) {
        toast.success(
          tr("agent.knowledge.toast.importDone.partial", {
            success: String(result.success_count),
            failed: String(result.failed_count),
            err: errMsg ? `(${errMsg})` : "",
          })
        );
      } else {
        toast.success(
          tr("agent.knowledge.toast.importDone.files", {
            success: String(result.success_count),
          })
        );
      }
      setImportDialogOpen(false);
      setImportFiles([]);
      try {
        await loadDocuments();
        await loadKnowledgeBases();
      } catch {
        toast.error(t("agent.knowledge.toast.importRefreshFailed"));
      }
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.importDocFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 导入 URL
  const handleImportUrls = async () => {
    if (!selectedKnowledgeBase) {
      toast.error(t("agent.knowledge.toast.selectKbFirst"));
      return;
    }
    const urls = importUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    if (urls.length === 0) {
      toast.error(t("agent.knowledge.toast.urlRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const result: ImportResult = await importFromUrls({
        knowledge_base_id: selectedKnowledgeBase.id,
        urls,
      });
      const errMsg = result.errors?.length ? result.errors[0] : "";
      if (result.failed_count > 0 && result.success_count === 0) {
        toast.error(
          errMsg ||
            tr("agent.knowledge.toast.importFailed.urls", {
              count: String(result.failed_count),
            })
        );
      } else if (result.failed_count > 0) {
        toast.success(
          tr("agent.knowledge.toast.importDone.partial", {
            success: String(result.success_count),
            failed: String(result.failed_count),
            err: errMsg ? `(${errMsg})` : "",
          })
        );
      } else {
        toast.success(
          tr("agent.knowledge.toast.importDone.urls", {
            success: String(result.success_count),
          })
        );
      }
      setImportDialogOpen(false);
      setImportUrls("");
      try {
        await loadDocuments();
        await loadKnowledgeBases();
      } catch {
        toast.error(t("agent.knowledge.toast.importRefreshFailed"));
      }
    } catch (error) {
      toast.error((error as Error).message || t("agent.knowledge.toast.importUrlFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(lang === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t("agent.knowledge.status.published")}
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {t("agent.knowledge.status.draft")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // 获取向量化状态标签
  const getEmbeddingStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t("agent.knowledge.embedding.completed")}
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {t("agent.knowledge.embedding.processing")}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            {t("agent.knowledge.embedding.failed")}
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {t("agent.knowledge.embedding.pending")}
          </span>
        );
    }
  };

  // 构建头部内容
  const headerContent = (
    <div className="bg-card border-b p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{t("agent.knowledge.title")}</h1>
        {!embedded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/agent/dashboard")}
          >
            {t("agent.common.back")}
          </Button>
        )}
      </div>
    </div>
  );

  // 构建主内容区
  const mainContent = (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden md:flex-row">
      {/* 左侧：知识库列表（小屏置顶且限高，避免挤掉文档区） */}
      <div className="flex h-[min(40vh,320px)] w-full shrink-0 flex-col border-b border-border bg-gray-50 md:h-auto md:max-h-none md:w-64 md:border-b-0 md:border-r">
        <div className="p-4 border-b">
          <Button
            onClick={() => setCreateKBDialogOpen(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("agent.knowledge.kb.create")}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loadingKBs ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">{t("common.loading")}</span>
            </div>
          ) : knowledgeBases.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">{t("agent.knowledge.kb.empty")}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {knowledgeBases.map((kb) => (
                <Card
                  key={kb.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedKnowledgeBase?.id === kb.id
                      ? "bg-green-50 border-green-300"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectKnowledgeBase(kb)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <h3 className="font-medium text-sm truncate">{kb.name}</h3>
                      </div>
                      {kb.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {kb.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {tr("agent.knowledge.kb.docCount", {
                            count: String(kb.document_count),
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditKB(kb);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteKB(kb);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：文档列表 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {selectedKnowledgeBase ? (
          <>
            {/* 文档列表头部 */}
            <div className="border-b bg-white p-3 sm:p-4">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <h2 className="text-lg font-semibold leading-tight break-words">
                  {selectedKnowledgeBase.name}
                </h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="rag-enabled"
                      className="whitespace-nowrap text-sm text-muted-foreground"
                    >
                      {t("agent.knowledge.rag")}
                    </Label>
                    <Switch
                      id="rag-enabled"
                      checked={selectedKnowledgeBase.rag_enabled !== false}
                      onCheckedChange={async (checked) => {
                        try {
                          const updated = await updateKnowledgeBaseRAGEnabled(selectedKnowledgeBase.id, checked);
                          setSelectedKnowledgeBase((prev) => (prev?.id === updated.id ? { ...prev, rag_enabled: updated.rag_enabled } : prev));
                          setKnowledgeBases((prev) => prev.map((kb) => (kb.id === updated.id ? { ...kb, rag_enabled: updated.rag_enabled } : kb)));
                        } catch (e) {
                          toast.error((e as Error).message || t("agent.knowledge.toast.updateFailed"));
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[8rem] sm:flex-initial"
                      onClick={() => {
                        setImportTab("url");
                        setImportDialogOpen(true);
                      }}
                    >
                      <LinkIcon className="mr-2 h-4 w-4 shrink-0" />
                      {t("agent.knowledge.import.url")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[8rem] sm:flex-initial"
                      onClick={() => {
                        setImportTab("file");
                        setImportDialogOpen(true);
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4 shrink-0" />
                      {t("agent.knowledge.import.file")}
                    </Button>
                    <Button size="sm" className="w-full sm:w-auto" onClick={handleOpenCreateDoc}>
                      <Plus className="mr-2 h-4 w-4 shrink-0" />
                      {t("agent.knowledge.doc.create")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 搜索和筛选 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("agent.knowledge.doc.searchPh")}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">{t("agent.knowledge.filter.all")}</option>
                  <option value="draft">{t("agent.knowledge.status.draft")}</option>
                  <option value="published">{t("agent.knowledge.status.published")}</option>
                </select>
              </div>
            </div>

            {/* 文档列表 */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {loadingDocs ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">{t("common.loading")}</span>
                </div>
              ) : (documents?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">
                    {searchKeyword || statusFilter !== "all"
                      ? t("agent.knowledge.doc.empty.filtered")
                      : t("agent.knowledge.doc.empty")}
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {(documents ?? []).map((doc) => (
                    <Card key={doc.id} className="p-3 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <FileText className="h-5 w-5 shrink-0 text-blue-600" />
                            <h3 className="min-w-0 flex-1 font-medium text-foreground break-words sm:truncate">
                              {doc.title}
                            </h3>
                            <span className="flex flex-wrap gap-1">
                              {getStatusBadge(doc.status)}
                              {getEmbeddingStatusBadge(doc.embedding_status)}
                            </span>
                          </div>
                          {doc.summary && (
                            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                              {doc.summary}
                            </p>
                          )}
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                            <span>
                              {t("agent.knowledge.doc.type")}: {doc.type}
                            </span>
                            <span className="break-words">
                              {t("agent.knowledge.doc.createdAt")}: {formatTime(doc.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:ml-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-w-0 flex-1 sm:flex-initial"
                              onClick={() => handleOpenEditDoc(doc)}
                            >
                              <Edit className="mr-1 h-4 w-4 shrink-0" />
                              {t("agent.common.edit")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="shrink-0"
                              onClick={() => handleOpenDeleteDoc(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {doc.status === "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => handleUnpublishDoc(doc.id)}
                              >
                                {t("agent.knowledge.doc.unpublish")}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => handlePublishDoc(doc.id)}
                              >
                                {t("agent.knowledge.doc.publish")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {documentResult && documentResult.total_page > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {tr("agent.knowledge.pagination", {
                      page: String(currentPage),
                      totalPage: String(documentResult.total_page),
                      total: String(documentResult.total),
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= documentResult.total_page}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground">{t("agent.knowledge.kb.selectOne")}</span>
          </div>
        )}
      </div>
    </div>
  );

  const dialogs = (
    <>
      <Dialog open={createKBDialogOpen} onOpenChange={setCreateKBDialogOpen}>
        <DialogContent className="max-h-[90dvh] max-w-[min(100vw-2rem,42rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("agent.knowledge.dialog.kbCreateTitle")}</DialogTitle>
            <DialogDescription>{t("agent.knowledge.dialog.kbCreateDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-kb-name">{t("agent.knowledge.field.name")} *</Label>
              <Input
                id="create-kb-name"
                value={createKBForm.name}
                onChange={(e) => setCreateKBForm({ ...createKBForm, name: e.target.value })}
                placeholder={t("agent.knowledge.ph.kbName")}
              />
            </div>
            <div>
              <Label htmlFor="create-kb-desc">{t("agent.knowledge.field.descOptional")}</Label>
              <Textarea
                id="create-kb-desc"
                value={createKBForm.description || ""}
                onChange={(e) =>
                  setCreateKBForm({ ...createKBForm, description: e.target.value })
                }
                placeholder={t("agent.knowledge.ph.kbDesc")}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateKBDialogOpen(false)}
                disabled={submitting}
              >
                {t("agent.common.cancel")}
              </Button>
              <Button onClick={handleCreateKB} disabled={submitting}>
                {submitting ? t("agent.knowledge.submitting.creating") : t("agent.common.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editKBDialogOpen} onOpenChange={setEditKBDialogOpen}>
        <DialogContent className="max-h-[90dvh] max-w-[min(100vw-2rem,42rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("agent.knowledge.dialog.kbEditTitle")}</DialogTitle>
            <DialogDescription>{t("agent.knowledge.dialog.kbEditDesc")}</DialogDescription>
          </DialogHeader>
          {selectedKnowledgeBase && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-kb-name">{t("agent.knowledge.field.name")} *</Label>
                <Input
                  id="edit-kb-name"
                  value={editKBForm.name || selectedKnowledgeBase.name}
                  onChange={(e) => setEditKBForm({ ...editKBForm, name: e.target.value })}
                  placeholder={t("agent.knowledge.ph.kbName")}
                />
              </div>
              <div>
                <Label htmlFor="edit-kb-desc">{t("agent.knowledge.field.descOptional")}</Label>
                <Textarea
                  id="edit-kb-desc"
                  value={editKBForm.description ?? selectedKnowledgeBase.description ?? ""}
                  onChange={(e) =>
                    setEditKBForm({ ...editKBForm, description: e.target.value })
                  }
                  placeholder={t("agent.knowledge.ph.kbDesc")}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditKBDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("agent.common.cancel")}
                </Button>
                <Button onClick={handleUpdateKB} disabled={submitting}>
                  {submitting ? t("agent.knowledge.submitting.updating") : t("agent.common.update")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteKBDialogOpen} onOpenChange={setDeleteKBDialogOpen}>
        <DialogContent className="max-w-[min(100vw-2rem,28rem)]">
          <DialogHeader>
            <DialogTitle>{t("agent.knowledge.dialog.kbDeleteTitle")}</DialogTitle>
          </DialogHeader>
          {selectedKnowledgeBase && (
            <div className="space-y-4">
              <p className="text-foreground">
                {tr("agent.knowledge.dialog.kbDeleteConfirm", { name: selectedKnowledgeBase.name })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("agent.knowledge.dialog.kbDeleteHint")}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteKBDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("agent.common.cancel")}
                </Button>
                <Button variant="destructive" onClick={handleDeleteKB} disabled={submitting}>
                  {submitting ? t("agent.knowledge.submitting.deleting") : t("agent.common.delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createDocDialogOpen} onOpenChange={setCreateDocDialogOpen}>
        <DialogContent className="max-h-[90dvh] max-w-[min(100vw-2rem,48rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("agent.knowledge.dialog.docCreateTitle")}</DialogTitle>
            <DialogDescription>{t("agent.knowledge.dialog.docCreateDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-doc-title">{t("agent.knowledge.field.title")} *</Label>
              <Input
                id="create-doc-title"
                value={createDocForm.title}
                onChange={(e) => setCreateDocForm({ ...createDocForm, title: e.target.value })}
                placeholder={t("agent.knowledge.ph.docTitle")}
              />
            </div>
            <div>
              <Label htmlFor="create-doc-summary">{t("agent.knowledge.field.summaryOptional")}</Label>
              <Textarea
                id="create-doc-summary"
                value={createDocForm.summary || ""}
                onChange={(e) => setCreateDocForm({ ...createDocForm, summary: e.target.value })}
                placeholder={t("agent.knowledge.ph.docSummary")}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="create-doc-content">{t("agent.knowledge.field.content")} *</Label>
              <Textarea
                id="create-doc-content"
                value={createDocForm.content}
                onChange={(e) =>
                  setCreateDocForm({ ...createDocForm, content: e.target.value })
                }
                placeholder={t("agent.knowledge.ph.docContent")}
                rows={10}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDocDialogOpen(false)}
                disabled={submitting}
              >
                {t("agent.common.cancel")}
              </Button>
              <Button onClick={handleCreateDoc} disabled={submitting}>
                {submitting ? t("agent.knowledge.submitting.creating") : t("agent.common.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDocDialogOpen} onOpenChange={setEditDocDialogOpen}>
        <DialogContent className="max-h-[90dvh] max-w-[min(100vw-2rem,48rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("agent.knowledge.dialog.docEditTitle")}</DialogTitle>
            <DialogDescription>{t("agent.knowledge.dialog.docEditDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-doc-title">{t("agent.knowledge.field.title")} *</Label>
              <Input
                id="edit-doc-title"
                value={editDocForm.title || ""}
                onChange={(e) => setEditDocForm({ ...editDocForm, title: e.target.value })}
                placeholder={t("agent.knowledge.ph.docTitle")}
              />
            </div>
            <div>
              <Label htmlFor="edit-doc-summary">{t("agent.knowledge.field.summaryOptional")}</Label>
              <Textarea
                id="edit-doc-summary"
                value={editDocForm.summary || ""}
                onChange={(e) => setEditDocForm({ ...editDocForm, summary: e.target.value })}
                placeholder={t("agent.knowledge.ph.docSummary")}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-doc-content">{t("agent.knowledge.field.content")} *</Label>
              <Textarea
                id="edit-doc-content"
                value={editDocForm.content || ""}
                onChange={(e) => setEditDocForm({ ...editDocForm, content: e.target.value })}
                placeholder={t("agent.knowledge.ph.docContent")}
                rows={10}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDocDialogOpen(false)}
                disabled={submitting}
              >
                {t("agent.common.cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (selectedDocument) {
                    handleUpdateDoc(selectedDocument.id);
                  }
                }}
                disabled={submitting}
              >
                {submitting ? t("agent.knowledge.submitting.updating") : t("agent.common.update")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDocDialogOpen} onOpenChange={setDeleteDocDialogOpen}>
        <DialogContent className="max-w-[min(100vw-2rem,28rem)]">
          <DialogHeader>
            <DialogTitle>{t("agent.knowledge.dialog.docDeleteTitle")}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <p className="text-foreground">
                {tr("agent.knowledge.dialog.docDeleteConfirm", { title: selectedDocument.title })}
              </p>
              <p className="text-sm text-muted-foreground">{t("common.irreversibleHint")}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDocDialogOpen(false)}
              disabled={submitting}
            >
              {t("agent.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDocument) {
                  handleDeleteDoc(selectedDocument.id);
                }
              }}
              disabled={submitting}
            >
              {submitting ? t("agent.knowledge.submitting.deleting") : t("agent.common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) {
            setImportFiles([]);
            setImportUrls("");
            setImportTab("file");
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] max-w-[min(100vw-2rem,42rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("agent.knowledge.dialog.importTitle")}</DialogTitle>
            <DialogDescription>{t("agent.knowledge.dialog.importDesc")}</DialogDescription>
          </DialogHeader>
          <Tabs
            value={importTab}
            onValueChange={(v) => setImportTab(v as "file" | "url")}
            defaultValue="file"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">{t("agent.knowledge.import.tabFile")}</TabsTrigger>
              <TabsTrigger value="url">{t("agent.knowledge.import.tabUrl")}</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="import-files">{t("agent.knowledge.import.pickFiles")}</Label>
                <Input
                  id="import-files"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImportFiles(files);
                  }}
                />
                {importFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {tr("agent.knowledge.import.filesSelected", {
                      count: String(importFiles.length),
                    })}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("agent.common.cancel")}
                </Button>
                <Button onClick={handleImportFiles} disabled={submitting}>
                  {submitting ? t("agent.knowledge.submitting.importing") : t("agent.knowledge.import.action")}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="url" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="import-urls">{t("agent.knowledge.import.urlListLabel")}</Label>
                <Textarea
                  id="import-urls"
                  value={importUrls}
                  onChange={(e) => setImportUrls(e.target.value)}
                  placeholder="https://example.com/page1&#10;https://example.com/page2"
                  rows={8}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("agent.common.cancel")}
                </Button>
                <Button onClick={handleImportUrls} disabled={submitting}>
                  {submitting ? t("agent.knowledge.submitting.importing") : t("agent.knowledge.import.action")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded) {
    return (
      <>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {headerContent}
          {mainContent}
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <ResponsiveLayout main={mainContent} header={headerContent} />
      {dialogs}
    </>
  );
}
