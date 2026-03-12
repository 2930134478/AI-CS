"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout";
import {
  fetchQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  fetchQuickReplyCategories,
  type QuickReplySummary,
  type CreateQuickReplyRequest,
  type UpdateQuickReplyRequest,
} from "@/features/agent/services/quickReplyApi";
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
  MessageSquare,
  Copy,
  Star,
} from "lucide-react";
import { toast } from "@/hooks/useToast";
import { Textarea } from "@/components/ui/textarea";

// 预设分类
const PRESET_CATEGORIES = ["问候", "常见问题", "产品介绍", "结束语", "其他"];

export default function QuickRepliesPage(props: any = {}) {
  const { embedded = false } = props;
  const router = useRouter();
  const { agent } = useAuth();
  const [quickReplies, setQuickReplies] = useState<QuickReplySummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReply, setSelectedReply] = useState<QuickReplySummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 创建表单
  const [createForm, setCreateForm] = useState<CreateQuickReplyRequest>({
    content: "",
    title: "",
    category: "",
  });

  // 编辑表单
  const [editForm, setEditForm] = useState<UpdateQuickReplyRequest>({});

  // 加载模板列表
  const loadQuickReplies = useCallback(async () => {
    if (!agent?.id) return;
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        fetchQuickReplies(agent.id, selectedCategory),
        fetchQuickReplyCategories(agent.id),
      ]);
      setQuickReplies(data);
      // 合并预设分类和实际分类
      const allCategories = [...new Set([...PRESET_CATEGORIES, ...cats])];
      setCategories(allCategories.filter(c => c));
    } catch (error) {
      console.error("加载快捷回复模板失败:", error);
      toast.error((error as Error).message || "加载快捷回复模板失败");
    } finally {
      setLoading(false);
    }
  }, [agent?.id, selectedCategory]);

  useEffect(() => {
    loadQuickReplies();
  }, [loadQuickReplies]);

  // 打开创建对话框
  const handleOpenCreate = () => {
    setCreateForm({
      content: "",
      title: "",
      category: "",
    });
    setCreateDialogOpen(true);
  };

  // 创建模板
  const handleCreate = async () => {
    if (!createForm.content.trim()) {
      toast.error("模板内容不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await createQuickReply({
        ...createForm,
        user_id: agent?.id,
      });
      setCreateDialogOpen(false);
      setCreateForm({ content: "", title: "", category: "" });
      await loadQuickReplies();
      toast.success("创建成功");
    } catch (error) {
      toast.error((error as Error).message || "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑对话框
  const handleOpenEdit = (reply: QuickReplySummary) => {
    setSelectedReply(reply);
    setEditForm({
      title: reply.title,
      content: reply.content,
      category: reply.category,
      sort_order: reply.sort_order,
      user_id: agent?.id,
    });
    setEditDialogOpen(true);
  };

  // 更新模板
  const handleUpdate = async () => {
    if (!selectedReply) return;
    if (!editForm.content?.trim()) {
      toast.error("模板内容不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await updateQuickReply(selectedReply.id, editForm);
      setEditDialogOpen(false);
      setSelectedReply(null);
      await loadQuickReplies();
      toast.success("更新成功");
    } catch (error) {
      toast.error((error as Error).message || "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除对话框
  const handleOpenDelete = (reply: QuickReplySummary) => {
    setSelectedReply(reply);
    setDeleteDialogOpen(true);
  };

  // 删除模板
  const handleDelete = async () => {
    if (!selectedReply) return;
    setSubmitting(true);
    try {
      await deleteQuickReply(selectedReply.id, agent?.id);
      setDeleteDialogOpen(false);
      setSelectedReply(null);
      await loadQuickReplies();
      toast.success("删除成功");
    } catch (error) {
      toast.error((error as Error).message || "删除失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 复制内容
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  };

  // 判断是否是公共模板
  const isPublicReply = (reply: QuickReplySummary) => reply.user_id === null;

  // 头部内容
  const headerContent = (
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">快捷回复</h1>
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("")}
          >
            全部
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          新建模板
        </Button>
      </div>
    </div>
  );

  // 主内容区
  const mainContent = (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-auto">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">加载中...</span>
        </div>
      ) : quickReplies.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">
            {selectedCategory ? "该分类下暂无模板" : "暂无快捷回复模板"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickReplies.map((reply) => (
            <Card key={reply.id} className="p-4 flex flex-col">
              <div className="flex-1 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <h3 className="font-medium text-foreground line-clamp-1">
                      {reply.title}
                    </h3>
                  </div>
                  {isPublicReply(reply) && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      公共
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-2 line-clamp-3 whitespace-pre-wrap">
                  {reply.content}
                </div>
                {reply.category && (
                  <div className="text-xs text-muted-foreground mb-2">
                    分类: {reply.category}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  使用次数: {reply.usage_count}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(reply.content)}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  复制
                </Button>
                {!isPublicReply(reply) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(reply)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenDelete(reply)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 嵌入模式
  if (embedded) {
    return (
      <>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {headerContent}
          {mainContent}
        </div>

        {/* 创建模板对话框 */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新建快捷回复</DialogTitle>
              <DialogDescription>创建一个常用的回复模板</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-title">标题（可选）</Label>
                <Input
                  id="create-title"
                  value={createForm.title || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  placeholder="不填则自动取内容前20字"
                />
              </div>
              <div>
                <Label htmlFor="create-content">内容 *</Label>
                <Textarea
                  id="create-content"
                  value={createForm.content}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, content: e.target.value })
                  }
                  placeholder="输入模板内容"
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="create-category">分类</Label>
                <Input
                  id="create-category"
                  value={createForm.category || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, category: e.target.value })
                  }
                  placeholder="选择或输入分类"
                  list="categories"
                />
                <datalist id="categories">
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
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

        {/* 编辑模板对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>编辑快捷回复</DialogTitle>
            </DialogHeader>
            {selectedReply && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">标题</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content">内容 *</Label>
                  <Textarea
                    id="edit-content"
                    value={editForm.content || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">分类</Label>
                  <Input
                    id="edit-category"
                    value={editForm.category || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    list="categories"
                  />
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
              <DialogTitle>删除快捷回复</DialogTitle>
            </DialogHeader>
            {selectedReply && (
              <div className="space-y-4">
                <p className="text-foreground">
                  确定要删除模板 <strong>&quot;{selectedReply.title}&quot;</strong> 吗？
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
    <ResponsiveLayout main={mainContent} header={headerContent} />
  );
}
