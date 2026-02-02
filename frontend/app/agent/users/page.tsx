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
  Plus,
  Edit,
  Trash2,
  Lock,
  Search,
  UserPlus,
  Save,
  X,
} from "lucide-react";

export default function UsersPage(props: any = {}) {
  const { embedded = false } = props;
  const router = useRouter();
  const { agent } = useAuth();
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
    nickname: "",
    email: "",
  });

  // 编辑用户表单
  const [editForm, setEditForm] = useState<UpdateUserRequest>({
    role: "agent",
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
      toast.error((error as Error).message || "加载用户列表失败");
    } finally {
      setLoading(false);
    }
  }, [agent?.id]);

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
      toast.error("用户名和密码不能为空");
      return;
    }
    setSubmitting(true);
    try {
      await createUser(createForm, agent.id);
      setCreateDialogOpen(false);
      await loadUsers();
      toast.success("创建成功");
    } catch (error) {
      toast.error((error as Error).message || "创建用户失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑对话框
  const handleOpenEdit = (user: UserSummary) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role as "admin" | "agent",
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
      toast.success("更新成功");
    } catch (error) {
      toast.error((error as Error).message || "更新用户失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开修改密码对话框
  const handleOpenPassword = (user: UserSummary) => {
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
      toast.error("新密码不能为空");
      return;
    }
    // 如果修改的是当前用户，需要旧密码；如果是其他用户，不需要旧密码
    const isCurrentUser = selectedUser.id === agent.id;
    if (isCurrentUser && !passwordForm.old_password?.trim()) {
      toast.error("修改自己的密码需要提供旧密码");
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
      toast.success("密码更新成功");
    } catch (error) {
      toast.error((error as Error).message || "更新密码失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除对话框
  const handleOpenDelete = (user: UserSummary) => {
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
      await deleteUser(selectedUser.id, agent.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
      toast.success("删除成功");
    } catch (error) {
      toast.error((error as Error).message || "删除用户失败");
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

  if (!agent || agent.role !== "admin") {
    return null; // 或者显示"权限不足"页面
  }

  // 构建头部内容
  const headerContent = (
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">用户管理</h1>
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
            placeholder="搜索用户（用户名、昵称、邮箱）..."
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
          创建用户
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
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground">
              {searchQuery ? "没有找到匹配的用户" : "暂无用户"}
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
                      {user.role === "admin" ? "管理员" : "客服"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 mb-2">
                    <div>用户名: {user.username}</div>
                    {user.email && <div>邮箱: {user.email}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    创建时间: {formatTime(user.created_at)}
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
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPassword(user)}
                    className="flex-1"
                  >
                    <Lock className="w-4 h-4 mr-1" />
                    密码
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleOpenDelete(user)}
                    disabled={user.id === agent.id}
                    title={user.id === agent.id ? "不能删除当前登录用户" : ""}
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

      {/* 创建用户对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-username">用户名 *</Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(e) =>
                  setCreateForm({ ...createForm, username: e.target.value })
                }
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <Label htmlFor="create-password">密码 *</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder="请输入密码"
              />
            </div>
            <div>
              <Label htmlFor="create-role">角色 *</Label>
              <select
                id="create-role"
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    role: e.target.value as "admin" | "agent",
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="agent">客服</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <Label htmlFor="create-nickname">昵称</Label>
              <Input
                id="create-nickname"
                value={createForm.nickname}
                onChange={(e) =>
                  setCreateForm({ ...createForm, nickname: e.target.value })
                }
                placeholder="请输入昵称（可选）"
              />
            </div>
            <div>
              <Label htmlFor="create-email">邮箱</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder="请输入邮箱（可选）"
              />
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

      {/* 编辑用户对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>用户名</Label>
                <Input value={selectedUser.username} disabled />
                <p className="text-xs text-muted-foreground mt-1">
                  用户名不能修改
                </p>
              </div>
              <div>
                <Label htmlFor="edit-role">角色 *</Label>
                <select
                  id="edit-role"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as "admin" | "agent",
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="agent">客服</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-nickname">昵称</Label>
                <Input
                  id="edit-nickname"
                  value={editForm.nickname || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nickname: e.target.value })
                  }
                  placeholder="请输入昵称"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">邮箱</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="请输入邮箱"
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
                  接收 AI 对话
                </Label>
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

      {/* 修改密码对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>用户名</Label>
                <Input value={selectedUser.username} disabled />
              </div>
              {selectedUser.id === agent?.id && (
                <div>
                  <Label htmlFor="password-old">旧密码 *</Label>
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
                    placeholder="请输入旧密码"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="password-new">新密码 *</Label>
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
                  placeholder="请输入新密码"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button onClick={handleUpdatePassword} disabled={submitting}>
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
            <DialogTitle>删除用户</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-foreground">
                确定要删除用户 <strong>{selectedUser.username}</strong> 吗？
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

