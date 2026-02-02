"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout";
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
      toast.error((error as Error).message || "加载知识库列表失败");
    } finally {
      setLoadingKBs(false);
    }
  }, []);

  // 加载文档列表
  const loadDocuments = useCallback(async () => {
    if (!selectedKnowledgeBase) {
      setDocuments([]);
      setDocumentResult(null);
      return;
    }

    setLoadingDocs(true);
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
      toast.error((error as Error).message || "加载文档列表失败");
      setDocuments([]);
      setDocumentResult(null);
    } finally {
      setLoadingDocs(false);
    }
  }, [selectedKnowledgeBase, currentPage, searchKeyword, statusFilter]);

  // 初始加载
  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  // 当选择知识库或搜索条件变化时，重新加载文档
  useEffect(() => {
    setCurrentPage(1); // 切换知识库或搜索时重置页码
    loadDocuments();
  }, [loadDocuments]);

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
      toast.error("知识库名称不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await createKnowledgeBase(createKBForm);
      setCreateKBDialogOpen(false);
      setCreateKBForm({ name: "", description: "" });
      await loadKnowledgeBases();
      toast.success("创建成功");
    } catch (error) {
      toast.error((error as Error).message || "创建知识库失败");
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
      toast.success("更新成功");
    } catch (error) {
      toast.error((error as Error).message || "更新知识库失败");
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
      toast.success("删除成功");
    } catch (error) {
      toast.error((error as Error).message || "删除知识库失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开创建文档对话框
  const handleOpenCreateDoc = () => {
    if (!selectedKnowledgeBase) {
      toast.error("请先选择知识库");
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
      toast.error("标题和内容不能为空");
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
      toast.success("创建成功");
    } catch (error) {
      toast.error((error as Error).message || "创建文档失败");
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
      toast.success("更新成功");
    } catch (error) {
      toast.error((error as Error).message || "更新文档失败");
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
      toast.success("删除成功");
    } catch (error) {
      toast.error((error as Error).message || "删除文档失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 发布文档
  const handlePublishDoc = async (docId: number) => {
    try {
      await publishDocument(docId);
      await loadDocuments();
      toast.success("发布成功");
    } catch (error) {
      toast.error((error as Error).message || "发布文档失败");
    }
  };

  // 取消发布文档
  const handleUnpublishDoc = async (docId: number) => {
    try {
      await unpublishDocument(docId);
      await loadDocuments();
      toast.success("取消发布成功");
    } catch (error) {
      toast.error((error as Error).message || "取消发布文档失败");
    }
  };

  // 导入文件
  const handleImportFiles = async () => {
    if (!selectedKnowledgeBase) {
      toast.error("请先选择知识库");
      return;
    }
    if (importFiles.length === 0) {
      toast.error("请选择要导入的文件");
      return;
    }
    setSubmitting(true);
    try {
      const result: ImportResult = await importDocuments(selectedKnowledgeBase.id, importFiles);
      const errMsg = result.errors?.length ? result.errors[0] : "";
      if (result.failed_count > 0 && result.success_count === 0) {
        toast.error(errMsg || `导入失败：${result.failed_count} 个文件未成功`);
      } else if (result.failed_count > 0) {
        toast.success(`导入完成：成功 ${result.success_count}，失败 ${result.failed_count}${errMsg ? `（${errMsg}）` : ""}`);
      } else {
        toast.success(`导入完成：成功 ${result.success_count} 个文件`);
      }
      setImportDialogOpen(false);
      setImportFiles([]);
      try {
        await loadDocuments();
        await loadKnowledgeBases();
      } catch {
        toast.error("导入成功，但刷新列表失败，请手动刷新页面");
      }
    } catch (error) {
      toast.error((error as Error).message || "导入文档失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 导入 URL
  const handleImportUrls = async () => {
    if (!selectedKnowledgeBase) {
      toast.error("请先选择知识库");
      return;
    }
    const urls = importUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    if (urls.length === 0) {
      toast.error("请输入至少一个 URL");
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
        toast.error(errMsg || `导入失败：${result.failed_count} 个 URL 未成功`);
      } else if (result.failed_count > 0) {
        toast.success(`导入完成：成功 ${result.success_count}，失败 ${result.failed_count}${errMsg ? `（${errMsg}）` : ""}`);
      } else {
        toast.success(`导入完成：成功 ${result.success_count} 个 URL`);
      }
      setImportDialogOpen(false);
      setImportUrls("");
      try {
        await loadDocuments();
        await loadKnowledgeBases();
      } catch {
        toast.error("导入成功，但刷新列表失败，请手动刷新页面");
      }
    } catch (error) {
      toast.error((error as Error).message || "导入 URL 失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
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
            已发布
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            草稿
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
            已完成
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            处理中
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            失败
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            待处理
          </span>
        );
    }
  };

  // 构建头部内容
  const headerContent = (
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">知识库管理</h1>
        {!embedded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/agent/dashboard")}
          >
            返回
          </Button>
        )}
      </div>
    </div>
  );

  // 构建主内容区
  const mainContent = (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：知识库列表 */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={() => setCreateKBDialogOpen(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建知识库
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loadingKBs ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : knowledgeBases.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">暂无知识库</span>
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
                          {kb.document_count} 篇文档
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedKnowledgeBase ? (
          <>
            {/* 文档列表头部 */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedKnowledgeBase.name}</h2>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 mr-2">
                    <Label htmlFor="rag-enabled" className="text-sm text-muted-foreground whitespace-nowrap">参与 RAG</Label>
                    <Switch
                      id="rag-enabled"
                      checked={selectedKnowledgeBase.rag_enabled !== false}
                      onCheckedChange={async (checked) => {
                        try {
                          const updated = await updateKnowledgeBaseRAGEnabled(selectedKnowledgeBase.id, checked);
                          setSelectedKnowledgeBase((prev) => (prev?.id === updated.id ? { ...prev, rag_enabled: updated.rag_enabled } : prev));
                          setKnowledgeBases((prev) => prev.map((kb) => (kb.id === updated.id ? { ...kb, rag_enabled: updated.rag_enabled } : kb)));
                        } catch (e) {
                          toast.error((e as Error).message || "更新失败");
                        }
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportTab("url");
                      setImportDialogOpen(true);
                    }}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    导入 URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportTab("file");
                      setImportDialogOpen(true);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    导入文件
                  </Button>
                  <Button size="sm" onClick={handleOpenCreateDoc}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建文档
                  </Button>
                </div>
              </div>

              {/* 搜索和筛选 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="搜索文档..."
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
                  <option value="all">全部状态</option>
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                </select>
              </div>
            </div>

            {/* 文档列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDocs ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">加载中...</span>
                </div>
              ) : (documents?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">
                    {searchKeyword || statusFilter !== "all"
                      ? "没有找到匹配的文档"
                      : "暂无文档"}
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {(documents ?? []).map((doc) => (
                    <Card key={doc.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <h3 className="font-medium text-foreground truncate">
                              {doc.title}
                            </h3>
                            {getStatusBadge(doc.status)}
                            {getEmbeddingStatusBadge(doc.embedding_status)}
                          </div>
                          {doc.summary && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {doc.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>类型: {doc.type}</span>
                            <span>创建时间: {formatTime(doc.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditDoc(doc)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              编辑
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenDeleteDoc(doc)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            {doc.status === "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnpublishDoc(doc.id)}
                              >
                                取消发布
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublishDoc(doc.id)}
                              >
                                发布
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
                    第 {currentPage} / {documentResult.total_page} 页，共 {documentResult.total} 条
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
            <span className="text-muted-foreground">请选择一个知识库</span>
          </div>
        )}
      </div>
    </div>
  );

  // 如果是嵌入模式，只返回内容，不包含 ResponsiveLayout
  if (embedded) {
    return (
      <>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {headerContent}
          {mainContent}
        </div>

        {/* 对话框 */}
        {/* 创建知识库对话框 */}
        <Dialog open={createKBDialogOpen} onOpenChange={setCreateKBDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建知识库</DialogTitle>
              <DialogDescription>填写知识库名称和描述</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-kb-name">名称 *</Label>
                <Input
                  id="create-kb-name"
                  value={createKBForm.name}
                  onChange={(e) =>
                    setCreateKBForm({ ...createKBForm, name: e.target.value })
                  }
                  placeholder="请输入知识库名称"
                />
              </div>
              <div>
                <Label htmlFor="create-kb-desc">描述（可选）</Label>
                <Textarea
                  id="create-kb-desc"
                  value={createKBForm.description || ""}
                  onChange={(e) =>
                    setCreateKBForm({ ...createKBForm, description: e.target.value })
                  }
                  placeholder="请输入知识库描述"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateKBDialogOpen(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button onClick={handleCreateKB} disabled={submitting}>
                  {submitting ? "创建中..." : "创建"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 编辑知识库对话框 */}
        <Dialog open={editKBDialogOpen} onOpenChange={setEditKBDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑知识库</DialogTitle>
              <DialogDescription>修改知识库名称和描述</DialogDescription>
            </DialogHeader>
            {selectedKnowledgeBase && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-kb-name">名称 *</Label>
                  <Input
                    id="edit-kb-name"
                    value={editKBForm.name || selectedKnowledgeBase.name}
                    onChange={(e) =>
                      setEditKBForm({ ...editKBForm, name: e.target.value })
                    }
                    placeholder="请输入知识库名称"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-kb-desc">描述（可选）</Label>
                  <Textarea
                    id="edit-kb-desc"
                    value={editKBForm.description ?? selectedKnowledgeBase.description ?? ""}
                    onChange={(e) =>
                      setEditKBForm({ ...editKBForm, description: e.target.value })
                    }
                    placeholder="请输入知识库描述"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditKBDialogOpen(false)}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button onClick={handleUpdateKB} disabled={submitting}>
                    {submitting ? "更新中..." : "更新"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 删除知识库对话框 */}
        <Dialog open={deleteKBDialogOpen} onOpenChange={setDeleteKBDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除知识库</DialogTitle>
            </DialogHeader>
            {selectedKnowledgeBase && (
              <div className="space-y-4">
                <p className="text-foreground">
                  确定要删除知识库 <strong>&quot;{selectedKnowledgeBase.name}&quot;</strong> 吗？
                </p>
                <p className="text-sm text-muted-foreground">
                  此操作将同时删除该知识库下的所有文档，此操作不可恢复，请谨慎操作。
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteKBDialogOpen(false)}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteKB}
                    disabled={submitting}
                  >
                    {submitting ? "删除中..." : "删除"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 创建文档对话框 */}
        <Dialog open={createDocDialogOpen} onOpenChange={setCreateDocDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建文档</DialogTitle>
              <DialogDescription>填写文档标题和内容</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-doc-title">标题 *</Label>
                <Input
                  id="create-doc-title"
                  value={createDocForm.title}
                  onChange={(e) =>
                    setCreateDocForm({ ...createDocForm, title: e.target.value })
                  }
                  placeholder="请输入文档标题"
                />
              </div>
              <div>
                <Label htmlFor="create-doc-summary">摘要（可选）</Label>
                <Textarea
                  id="create-doc-summary"
                  value={createDocForm.summary || ""}
                  onChange={(e) =>
                    setCreateDocForm({ ...createDocForm, summary: e.target.value })
                  }
                  placeholder="请输入文档摘要"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="create-doc-content">内容 *</Label>
                <Textarea
                  id="create-doc-content"
                  value={createDocForm.content}
                  onChange={(e) =>
                    setCreateDocForm({ ...createDocForm, content: e.target.value })
                  }
                  placeholder="请输入文档内容"
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
                  取消
                </Button>
                <Button onClick={handleCreateDoc} disabled={submitting}>
                  {submitting ? "创建中..." : "创建"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 编辑文档对话框 */}
        <Dialog open={editDocDialogOpen} onOpenChange={setEditDocDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑文档</DialogTitle>
              <DialogDescription>修改文档标题和内容</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-doc-title">标题 *</Label>
                <Input
                  id="edit-doc-title"
                  value={editDocForm.title || ""}
                  onChange={(e) =>
                    setEditDocForm({ ...editDocForm, title: e.target.value })
                  }
                  placeholder="请输入文档标题"
                />
              </div>
              <div>
                <Label htmlFor="edit-doc-summary">摘要（可选）</Label>
                <Textarea
                  id="edit-doc-summary"
                  value={editDocForm.summary || ""}
                  onChange={(e) =>
                    setEditDocForm({ ...editDocForm, summary: e.target.value })
                  }
                  placeholder="请输入文档摘要"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-doc-content">内容 *</Label>
                <Textarea
                  id="edit-doc-content"
                  value={editDocForm.content || ""}
                  onChange={(e) =>
                    setEditDocForm({ ...editDocForm, content: e.target.value })
                  }
                  placeholder="请输入文档内容"
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
                  取消
                </Button>
                <Button
                  onClick={() => {
                    if (selectedDocument) {
                      handleUpdateDoc(selectedDocument.id);
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? "更新中..." : "更新"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 删除文档对话框 */}
        <Dialog open={deleteDocDialogOpen} onOpenChange={setDeleteDocDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除文档</DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <p className="text-foreground">
                  确定要删除文档 <strong>&quot;{selectedDocument.title}&quot;</strong> 吗？
                </p>
                <p className="text-sm text-muted-foreground">
                  此操作不可恢复，请谨慎操作。
                </p>
              </div>
            )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDocDialogOpen(false)}
                  disabled={submitting}
                >
                  取消
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
                  {submitting ? "删除中..." : "删除"}
                </Button>
              </div>
          </DialogContent>
        </Dialog>

        {/* 导入文档对话框（文件上传 + URL 导入） */}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>导入文档</DialogTitle>
              <DialogDescription>
                选择文件上传或输入 URL 批量导入。当前支持的文件格式：<strong>Markdown（.md、.markdown）</strong>；PDF、Word 解析功能开发中。
              </DialogDescription>
            </DialogHeader>
            <Tabs
              value={importTab}
              onValueChange={(v) => setImportTab(v as "file" | "url")}
              defaultValue="file"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">文件上传</TabsTrigger>
                <TabsTrigger value="url">URL 导入</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="import-files">选择文件</Label>
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
                      已选择 {importFiles.length} 个文件
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setImportDialogOpen(false)}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button onClick={handleImportFiles} disabled={submitting}>
                    {submitting ? "导入中..." : "导入"}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="url" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="import-urls">URL 列表（每行一个）</Label>
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
                    取消
                  </Button>
                  <Button onClick={handleImportUrls} disabled={submitting}>
                    {submitting ? "导入中..." : "导入"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <ResponsiveLayout
      main={mainContent}
      header={headerContent}
    />
  );
}
