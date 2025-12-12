"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout";
import {
  fetchFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  type FAQSummary,
  type CreateFAQRequest,
  type UpdateFAQRequest,
} from "@/features/agent/services/faqApi";
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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  Save,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface FAQsPageProps {
  embedded?: boolean; // 是否嵌入模式（不使用 ResponsiveLayout）
}

export default function FAQsPage({ embedded = false }: FAQsPageProps) {
  const router = useRouter();
  const { agent } = useAuth();
  const [faqs, setFaqs] = useState<FAQSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 创建 FAQ 表单
  const [createForm, setCreateForm] = useState<CreateFAQRequest>({
    question: "",
    answer: "",
    keywords: "",
  });

  // 编辑 FAQ 表单
  const [editForm, setEditForm] = useState<UpdateFAQRequest>({
    question: "",
    answer: "",
    keywords: "",
  });

  // 加载 FAQ 列表
  const loadFAQs = useCallback(async () => {
    setLoading(true);
    try {
      // 如果搜索框有内容，使用关键词搜索；否则加载全部
      const query = searchQuery.trim() || undefined;
      const data = await fetchFAQs(query);
      setFaqs(data);
    } catch (error) {
      console.error("加载 FAQ 列表失败:", error);
      alert((error as Error).message || "加载 FAQ 列表失败");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // 初始加载和搜索
  useEffect(() => {
    // 延迟搜索，避免频繁请求
    const timer = setTimeout(() => {
      loadFAQs();
    }, 500);

    return () => clearTimeout(timer);
  }, [loadFAQs]);

  // 打开创建对话框
  const handleOpenCreate = () => {
    setCreateForm({
      question: "",
      answer: "",
      keywords: "",
    });
    setCreateDialogOpen(true);
  };

  // 创建 FAQ
  const handleCreate = async () => {
    if (!createForm.question.trim() || !createForm.answer.trim()) {
      alert("问题和答案不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await createFAQ(createForm);
      setCreateDialogOpen(false);
      setCreateForm({ question: "", answer: "", keywords: "" });
      await loadFAQs();
      alert("创建成功");
    } catch (error) {
      alert((error as Error).message || "创建 FAQ 失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑对话框
  const handleOpenEdit = (faq: FAQSummary) => {
    setSelectedFAQ(faq);
    setEditForm({
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords || "",
    });
    setEditDialogOpen(true);
  };

  // 更新 FAQ
  const handleUpdate = async () => {
    if (!selectedFAQ) {
      return;
    }
    if (!editForm.question?.trim() || !editForm.answer?.trim()) {
      alert("问题和答案不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await updateFAQ(selectedFAQ.id, editForm);
      setEditDialogOpen(false);
      setSelectedFAQ(null);
      await loadFAQs();
      alert("更新成功");
    } catch (error) {
      alert((error as Error).message || "更新 FAQ 失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除对话框
  const handleOpenDelete = (faq: FAQSummary) => {
    setSelectedFAQ(faq);
    setDeleteDialogOpen(true);
  };

  // 删除 FAQ
  const handleDelete = async () => {
    if (!selectedFAQ) {
      return;
    }
    setSubmitting(true);
    try {
      await deleteFAQ(selectedFAQ.id);
      setDeleteDialogOpen(false);
      setSelectedFAQ(null);
      await loadFAQs();
      alert("删除成功");
    } catch (error) {
      alert((error as Error).message || "删除 FAQ 失败");
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

  // 构建头部内容
  const headerContent = (
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">事件管理（FAQ）</h1>
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

      {/* 搜索和操作栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="关键词搜索（用 % 分隔，例如：openai%api%调用）..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建事件
        </Button>
      </div>
    </div>
  );

  // 构建主内容区
  const mainContent = (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-auto">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">加载中...</span>
        </div>
      ) : faqs.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">
            {searchQuery ? "没有找到匹配的事件" : "暂无事件"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faqs.map((faq) => (
            <Card key={faq.id} className="p-4 flex flex-col">
              <div className="flex-1 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <h3 className="font-medium text-foreground flex-1 line-clamp-2">
                    {faq.question}
                  </h3>
                </div>
                <div className="text-sm text-muted-foreground mb-2 line-clamp-3">
                  {faq.answer}
                </div>
                {faq.keywords && (
                  <div className="text-xs text-muted-foreground mb-2">
                    关键词: {faq.keywords}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  创建时间: {formatTime(faq.created_at)}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(faq)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleOpenDelete(faq)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
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
        {/* 创建 FAQ 对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建新事件</DialogTitle>
            <DialogDescription>
              填写问题和答案，可以添加关键词以便搜索
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-question">问题 *</Label>
              <Textarea
                id="create-question"
                value={createForm.question}
                onChange={(e) =>
                  setCreateForm({ ...createForm, question: e.target.value })
                }
                placeholder="请输入问题"
                rows={2}
                className="resize-none"
              />
            </div>
            <div>
              <Label htmlFor="create-answer">答案 *</Label>
              <Textarea
                id="create-answer"
                value={createForm.answer}
                onChange={(e) =>
                  setCreateForm({ ...createForm, answer: e.target.value })
                }
                placeholder="请输入答案"
                rows={6}
                className="resize-none"
              />
            </div>
            <div>
              <Label htmlFor="create-keywords">关键词（可选）</Label>
              <Input
                id="create-keywords"
                value={createForm.keywords}
                onChange={(e) =>
                  setCreateForm({ ...createForm, keywords: e.target.value })
                }
                placeholder="例如：API、错误、配置（用逗号或空格分隔）"
              />
              <p className="text-xs text-muted-foreground mt-1">
                提示：即使不填写关键词，系统也会自动搜索问题和答案中的内容。关键词字段用于添加额外的搜索索引，帮助用户更快找到相关内容。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "创建中..." : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑 FAQ 对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑事件</DialogTitle>
            <DialogDescription>
              修改问题和答案，可以更新关键词以便搜索
            </DialogDescription>
          </DialogHeader>
          {selectedFAQ && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-question">问题 *</Label>
                <Textarea
                  id="edit-question"
                  value={editForm.question || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, question: e.target.value })
                  }
                  placeholder="请输入问题"
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-answer">答案 *</Label>
                <Textarea
                  id="edit-answer"
                  value={editForm.answer || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, answer: e.target.value })
                  }
                  placeholder="请输入答案"
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-keywords">关键词（可选）</Label>
                <Input
                  id="edit-keywords"
                  value={editForm.keywords || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, keywords: e.target.value })
                  }
                  placeholder="例如：API、错误、配置（用逗号或空格分隔）"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  提示：即使不填写关键词，系统也会自动搜索问题和答案中的内容。关键词字段用于添加额外的搜索索引，帮助用户更快找到相关内容。
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button onClick={handleUpdate} disabled={submitting}>
                  {submitting ? "更新中..." : "更新"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除事件</DialogTitle>
          </DialogHeader>
          {selectedFAQ && (
            <div className="space-y-4">
              <p className="text-foreground">
                确定要删除事件 <strong>"{selectedFAQ.question}"</strong> 吗？
              </p>
              <p className="text-sm text-muted-foreground">
                此操作不可恢复，请谨慎操作。
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? "删除中..." : "删除"}
                </Button>
              </div>
            </div>
          )}
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

