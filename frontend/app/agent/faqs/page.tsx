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
import { toast } from "@/hooks/useToast";
import { Textarea } from "@/components/ui/textarea";
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";

export default function FAQsPage(props: any = {}) {
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
      toast.error((error as Error).message || t("agent.faqs.toast.loadFailed"));
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
      toast.error(t("agent.faqs.toast.emptyRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createFAQ(createForm);
      setCreateDialogOpen(false);
      setCreateForm({ question: "", answer: "", keywords: "" });
      await loadFAQs();
      toast.success(t("agent.faqs.toast.createSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.faqs.toast.createFailed"));
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
      toast.error(t("agent.faqs.toast.emptyRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await updateFAQ(selectedFAQ.id, editForm);
      setEditDialogOpen(false);
      setSelectedFAQ(null);
      await loadFAQs();
      toast.success(t("agent.faqs.toast.updateSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.faqs.toast.updateFailed"));
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
      toast.success(t("agent.faqs.toast.deleteSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.faqs.toast.deleteFailed"));
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

  // 构建头部内容
  const headerContent = (
    <div className="border-b bg-card p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{t("agent.faqs.title")}</h1>
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

      {/* 搜索和操作栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("agent.faqs.search.placeholder")}
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
          {t("agent.faqs.createButton")}
        </Button>
      </div>
    </div>
  );

  // 构建主内容区
  const mainContent = (
    <div className="scrollbar-auto flex-1 overflow-y-auto p-3 sm:p-4">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">{t("common.loading")}</span>
        </div>
      ) : faqs.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">
            {searchQuery ? t("agent.faqs.empty.filtered") : t("agent.faqs.empty")}
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
                    {t("agent.faqs.card.keywords")}: {faq.keywords}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {t("agent.faqs.card.createdAt")}: {formatTime(faq.created_at)}
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
                  {t("agent.faqs.card.edit")}
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

  const faqDialogs = (
    <>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("agent.faqs.dialog.createTitle2")}</DialogTitle>
            <DialogDescription>{t("agent.faqs.dialog.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-question">{t("agent.faqs.form.question")} *</Label>
              <Textarea
                id="create-question"
                value={createForm.question}
                onChange={(e) =>
                  setCreateForm({ ...createForm, question: e.target.value })
                }
                placeholder={t("agent.faqs.form.placeholder.question")}
                rows={2}
                className="resize-none"
              />
            </div>
            <div>
              <Label htmlFor="create-answer">{t("agent.faqs.form.answer")} *</Label>
              <Textarea
                id="create-answer"
                value={createForm.answer}
                onChange={(e) =>
                  setCreateForm({ ...createForm, answer: e.target.value })
                }
                placeholder={t("agent.faqs.form.placeholder.answer")}
                rows={6}
                className="resize-none"
              />
            </div>
            <div>
              <Label htmlFor="create-keywords">{t("agent.faqs.form.keywordsOptional")}</Label>
              <Input
                id="create-keywords"
                value={createForm.keywords}
                onChange={(e) =>
                  setCreateForm({ ...createForm, keywords: e.target.value })
                }
                placeholder={t("agent.faqs.form.placeholder.keywords")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("agent.faqs.form.keywordsTip")}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={submitting}
              >
                {t("agent.common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? t("agent.faqs.submit.creating") : t("agent.common.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("agent.faqs.dialog.editTitle")}</DialogTitle>
            <DialogDescription>{t("agent.faqs.dialog.editDesc")}</DialogDescription>
          </DialogHeader>
          {selectedFAQ && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-question">{t("agent.faqs.form.question")} *</Label>
                <Textarea
                  id="edit-question"
                  value={editForm.question || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, question: e.target.value })
                  }
                  placeholder={t("agent.faqs.form.placeholder.question")}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-answer">{t("agent.faqs.form.answer")} *</Label>
                <Textarea
                  id="edit-answer"
                  value={editForm.answer || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, answer: e.target.value })
                  }
                  placeholder={t("agent.faqs.form.placeholder.answer")}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-keywords">{t("agent.faqs.form.keywordsOptional")}</Label>
                <Input
                  id="edit-keywords"
                  value={editForm.keywords || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, keywords: e.target.value })
                  }
                  placeholder={t("agent.faqs.form.placeholder.keywords")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("agent.faqs.form.keywordsTip")}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("agent.common.cancel")}
                </Button>
                <Button onClick={handleUpdate} disabled={submitting}>
                  {submitting ? t("common.saving") : t("agent.common.update")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agent.faqs.dialog.deleteTitle")}</DialogTitle>
          </DialogHeader>
          {selectedFAQ && (
            <div className="space-y-4">
              <p className="text-foreground">
                {tr("agent.faqs.dialog.deleteConfirm", { name: selectedFAQ.question })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("common.irreversibleHint")}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("agent.common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? t("agent.faqs.submit.deleting") : t("agent.common.delete")}
                </Button>
              </div>
            </div>
          )}
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
        {faqDialogs}
      </>
    );
  }

  return (
    <>
      <ResponsiveLayout main={mainContent} header={headerContent} />
      {faqDialogs}
    </>
  );
}

