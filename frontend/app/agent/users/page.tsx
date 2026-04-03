"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
  type UserSummary,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UpdatePasswordRequest,
} from "@/features/agent/services/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/useToast";
import {
  PERMISSION_OPTIONS,
  defaultAgentPermissions,
  type PermissionKey,
} from "@/lib/constants/agent-permissions";
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import {
  Edit,
  Trash2,
  Lock,
  Search,
  UserPlus,
} from "lucide-react";

const PERM_LABEL: Record<PermissionKey, I18nKey> = {
  chat: "agent.perm.chat",
  kb_test: "agent.perm.kb_test",
  knowledge: "agent.perm.knowledge",
  faqs: "agent.perm.faqs",
  analytics: "agent.perm.analytics",
  logs: "agent.perm.logs",
  prompts: "agent.perm.prompts",
  settings: "agent.perm.settings",
  users: "agent.perm.users",
};

export default function UsersPage(props: any = {}) {
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
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 创建用户表单
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: "",
    password: "",
    role: "agent",
    permissions: defaultAgentPermissions(),
    nickname: "",
    email: "",
  });

  // 编辑用户表单
  const [editForm, setEditForm] = useState<UpdateUserRequest>({
    role: "agent",
    permissions: defaultAgentPermissions(),
    nickname: "",
    email: "",
    receive_ai_conversations: true,
  });

  // 修改密码表单
  const [passwordForm, setPasswordForm] = useState<UpdatePasswordRequest>({
    old_password: "",
    new_password: "",
  });

  // 检查权限
  useEffect(() => {
    if (agent && agent.role !== "admin") {
      router.push("/agent/dashboard");
    }
  }, [agent, router]);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    if (!agent?.id) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUsers(agent.id);
      setUsers(data);
    } catch (error) {
      console.error("加载用户列表失败:", error);
      toast.error((error as Error).message || t("agent.users.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [agent?.id, t]);

  // 初始加载
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 过滤用户列表
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      (user.nickname && user.nickname.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });

  // 打开创建对话框
  const handleOpenCreate = () => {
    setCreateForm({
      username: "",
      password: "",
      role: "agent",
      permissions: defaultAgentPermissions(),
      nickname: "",
      email: "",
    });
    setCreateDialogOpen(true);
  };

  // 创建用户
  const handleCreate = async () => {
    if (!agent?.id) {
      return;
    }
    if (!createForm.username.trim() || !createForm.password.trim()) {
      toast.error(t("agent.users.toast.usernamePasswordRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createUser(createForm, agent.id);
      setCreateDialogOpen(false);
      await loadUsers();
      toast.success(t("agent.users.toast.createSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.users.toast.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑对话框
  const handleOpenEdit = (user: UserSummary) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role as "admin" | "agent",
      permissions:
        user.role === "admin"
          ? PERMISSION_OPTIONS.map((p) => p.key)
          : ((user.permissions as PermissionKey[] | undefined) ??
            defaultAgentPermissions()),
      nickname: user.nickname || "",
      email: user.email || "",
      receive_ai_conversations: user.receive_ai_conversations,
    });
    setEditDialogOpen(true);
  };

  // 更新用户
  const handleUpdate = async () => {
    if (!agent?.id || !selectedUser) {
      return;
    }
    setSubmitting(true);
    try {
      await updateUser(selectedUser.id, editForm, agent.id);
      setEditDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
      toast.success(t("agent.users.toast.updateSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.users.toast.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开修改密码对话框
  const handleOpenPassword = (user: UserSummary) => {
    if (user.role === "admin") {
      toast.error(t("agent.users.toast.adminPasswordDisabled"));
      return;
    }
    setSelectedUser(user);
    setPasswordForm({
      old_password: "",
      new_password: "",
    });
    setPasswordDialogOpen(true);
  };

  // 更新密码
  const handleUpdatePassword = async () => {
    if (!agent?.id || !selectedUser) {
      return;
    }
    if (!passwordForm.new_password.trim()) {
      toast.error(t("agent.users.toast.newPasswordRequired"));
      return;
    }
    // 如果修改的是当前用户，需要旧密码；如果是其他用户，不需要旧密码
    const isCurrentUser = selectedUser.id === agent.id;
    if (isCurrentUser && !passwordForm.old_password?.trim()) {
      toast.error(t("agent.users.toast.oldPasswordRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await updateUserPassword(
        selectedUser.id,
        isCurrentUser ? passwordForm : { new_password: passwordForm.new_password },
        agent.id
      );
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setPasswordForm({ old_password: "", new_password: "" });
      toast.success(t("agent.users.toast.passwordSuccess"));
    } catch (error) {
      toast.error((error as Error).message || t("agent.users.toast.passwordFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除对话框
  const handleOpenDelete = (user: UserSummary) => {
    if (user.role === "admin") {
      toast.error(t("agent.users.toast.adminDeleteDisabled"));
      return;
    }
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // 删除用户
  const handleDelete = async () => {
    if (!agent?.id || !selectedUser) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await deleteUser(selectedUser.id, agent.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
      if (result.transferredAIConfigs > 0) {
        toast.success(
          tr("agent.users.toast.deleteTransferred", {
            count: String(result.transferredAIConfigs),
          })
        );
      } else {
        toast.success(t("agent.users.toast.deleteSuccess"));
      }
    } catch (error) {
      toast.error((error as Error).message || t("agent.users.toast.deleteFailed"));
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

  if (!agent || agent.role !== "admin") {
    return null; // 或者显示"权限不足"页面
  }

  // 构建头部内容
  const headerContent = (
    <div className="border-b bg-card p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{t("agent.users.title")}</h1>
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
            placeholder={t("agent.users.search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t("agent.users.createButton")}
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
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground">
              {searchQuery ? t("agent.users.empty.filtered") : t("agent.users.empty")}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 flex flex-col">
                <div className="mb-3 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-foreground">
                      {user.nickname || user.username}
                    </span>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role === "admin"
                        ? t("agent.users.role.admin")
                        : t("agent.users.role.agent")}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 mb-2">
                    <div>
                      {t("agent.users.field.username")}: {user.username}
                    </div>
                    {user.email && (
                      <div>
                        {t("agent.users.field.email")}: {user.email}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("agent.users.field.createdAt")}: {formatTime(user.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(user)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {t("agent.users.card.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPassword(user)}
                    className="flex-1"
                    disabled={user.role === "admin"}
                    title={
                      user.role === "admin"
                        ? t("agent.users.tooltip.adminPasswordDbOnly")
                        : ""
                    }
                  >
                    <Lock className="w-4 h-4 mr-1" />
                    {t("agent.users.card.password")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleOpenDelete(user)}
                    disabled={user.id === agent.id || user.role === "admin"}
                    title={
                      user.role === "admin"
                        ? t("agent.users.tooltip.adminDeleteDbOnly")
                        : user.id === agent.id
                          ? t("agent.users.tooltip.cannotDeleteSelf")
                          : ""
                    }
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

  const userDialogs = (
    <>
      {/* 创建用户对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agent.users.dialog.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-username">{t("agent.users.form.username")} *</Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(e) =>
                  setCreateForm({ ...createForm, username: e.target.value })
                }
                placeholder={t("agent.users.placeholder.username")}
              />
            </div>
            <div>
              <Label htmlFor="create-password">{t("agent.users.form.password")} *</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder={t("agent.users.placeholder.password")}
              />
            </div>
            <div>
              <Label htmlFor="create-role">{t("agent.users.form.role")} *</Label>
              <select
                id="create-role"
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    role: e.target.value as "admin" | "agent",
                    permissions:
                      e.target.value === "admin"
                        ? PERMISSION_OPTIONS.map((p) => p.key)
                        : defaultAgentPermissions(),
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="agent">{t("agent.users.role.agent")}</option>
                <option value="admin">{t("agent.users.role.admin")}</option>
              </select>
            </div>

            {/* 功能权限（开/关一级；role=admin 默认全开） */}
            {createForm.role !== "admin" && (
              <div>
                <Label>{t("agent.users.form.permissions")}</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PERMISSION_OPTIONS.map((p) => {
                    const checked = (createForm.permissions ?? []).includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(createForm.permissions ?? []);
                            if (e.target.checked) next.add(p.key);
                            else next.delete(p.key);
                            setCreateForm({ ...createForm, permissions: Array.from(next) });
                          }}
                        />
                        <span>{t(PERM_LABEL[p.key])}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("agent.users.form.permissionsHint")}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="create-nickname">{t("agent.users.form.nickname")}</Label>
              <Input
                id="create-nickname"
                value={createForm.nickname}
                onChange={(e) =>
                  setCreateForm({ ...createForm, nickname: e.target.value })
                }
                placeholder={t("agent.users.placeholder.nicknameOptional")}
              />
            </div>
            <div>
              <Label htmlFor="create-email">{t("agent.users.form.email")}</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder={t("agent.users.placeholder.emailOptional")}
              />
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
                {submitting ? t("agent.users.submit.creating") : t("agent.common.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agent.users.dialog.editTitle")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>{t("agent.users.field.username")}</Label>
                <Input value={selectedUser.username} disabled />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("agent.users.usernameImmutableHint")}
                </p>
              </div>
              <div>
                <Label htmlFor="edit-role">{t("agent.users.form.role")} *</Label>
                <select
                  id="edit-role"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as "admin" | "agent",
                      permissions:
                        e.target.value === "admin"
                          ? PERMISSION_OPTIONS.map((p) => p.key)
                          : defaultAgentPermissions(),
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="agent">{t("agent.users.role.agent")}</option>
                  <option value="admin">{t("agent.users.role.admin")}</option>
                </select>
              </div>

              {editForm.role !== "admin" && (
                <div>
                  <Label>{t("agent.users.form.permissions")}</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PERMISSION_OPTIONS.map((p) => {
                      const checked = (editForm.permissions ?? []).includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(editForm.permissions ?? []);
                              if (e.target.checked) next.add(p.key);
                              else next.delete(p.key);
                              setEditForm({ ...editForm, permissions: Array.from(next) });
                            }}
                          />
                          <span>{t(PERM_LABEL[p.key])}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="edit-nickname">{t("agent.users.form.nickname")}</Label>
                <Input
                  id="edit-nickname"
                  value={editForm.nickname || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nickname: e.target.value })
                  }
                  placeholder={t("agent.users.placeholder.nickname")}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">{t("agent.users.form.email")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder={t("agent.users.placeholder.email")}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-receive-ai"
                  checked={editForm.receive_ai_conversations ?? true}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      receive_ai_conversations: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="edit-receive-ai" className="cursor-pointer">
                  {t("agent.users.receiveAiLabel")}
                </Label>
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
                  {submitting ? t("agent.users.submit.updating") : t("agent.common.update")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agent.users.dialog.passwordTitle")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>{t("agent.users.field.username")}</Label>
                <Input value={selectedUser.username} disabled />
              </div>
              {selectedUser.id === agent?.id && (
                <div>
                  <Label htmlFor="password-old">{t("agent.users.form.oldPassword")} *</Label>
                  <Input
                    id="password-old"
                    type="password"
                    value={passwordForm.old_password || ""}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        old_password: e.target.value,
                      })
                    }
                    placeholder={t("agent.users.placeholder.oldPassword")}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="password-new">{t("agent.users.form.newPassword")} *</Label>
                <Input
                  id="password-new"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value,
                    })
                  }
                  placeholder={t("agent.users.placeholder.password")}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("agent.common.cancel")}
                </Button>
                <Button onClick={handleUpdatePassword} disabled={submitting}>
                  {submitting ? t("agent.users.submit.updating") : t("agent.common.update")}
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
            <DialogTitle>{t("agent.users.dialog.deleteTitle")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-foreground">
                {tr("agent.users.dialog.deleteConfirm", {
                  username: selectedUser.username,
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("agent.users.dialog.deleteNote")}
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
                  {submitting ? t("agent.users.submit.deleting") : t("agent.common.delete")}
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
        {userDialogs}
      </>
    );
  }

  return (
    <>
      <ResponsiveLayout main={mainContent} header={headerContent} />
      {userDialogs}
    </>
  );
}

