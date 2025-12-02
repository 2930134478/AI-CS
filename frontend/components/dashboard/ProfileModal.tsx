"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Profile } from "@/features/agent/types";
import {
  updateProfile as updateProfileApi,
  uploadAvatar as uploadAvatarApi,
  UpdateProfilePayload,
} from "@/features/agent/services/profileApi";
import { getAvatarUrl, getAvatarColor, getAvatarInitial } from "@/utils/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileModalProps {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (profile: Profile) => void;
}

export function ProfileModal({
  profile,
  open,
  onClose,
  onUpdate,
}: ProfileModalProps) {
  const [editingNickname, setEditingNickname] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当弹窗打开或 profile 变化时，初始化表单
  useEffect(() => {
    if (open && profile) {
      setNickname(profile.nickname || "");
      setEmail(profile.email || "");
      setAvatarPreview(profile.avatar_url || null);
      setEditingNickname(false);
      setEditingEmail(false);
      setErrorMessage("");
    }
  }, [open, profile]);

  // 选择头像文件
  const handleAvatarSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !profile) {
        return;
      }

      // 验证文件类型
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage("只支持上传图片文件（jpg、png、gif）");
        return;
      }

      // 验证文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("头像文件大小不能超过10MB");
        return;
      }

      // 预览头像
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 上传头像
      setUploading(true);
      setErrorMessage("");
      try {
        const updated = await uploadAvatarApi(profile.id, file);
        onUpdate(updated);
        setAvatarPreview(updated.avatar_url);
      } catch (error) {
        setErrorMessage((error as Error).message || "上传头像失败，请稍后重试");
        // 恢复原头像
        setAvatarPreview(profile.avatar_url || null);
      } finally {
        setUploading(false);
      }
    },
    [profile, onUpdate]
  );

  // 保存昵称
  const handleSaveNickname = useCallback(async () => {
    if (!profile || !nickname.trim()) {
      return;
    }
    setSaving(true);
    setErrorMessage("");
    try {
      const payload: UpdateProfilePayload = {
        nickname: nickname.trim() || undefined,
      };
      const updated = await updateProfileApi(profile.id, payload);
      onUpdate(updated);
      setEditingNickname(false);
    } catch (error) {
      setErrorMessage((error as Error).message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }, [profile, nickname, onUpdate]);

  // 保存邮箱
  const handleSaveEmail = useCallback(async () => {
    if (!profile) {
      return;
    }
    setSaving(true);
    setErrorMessage("");
    try {
      const payload: UpdateProfilePayload = {
        email: email.trim() || undefined,
      };
      const updated = await updateProfileApi(profile.id, payload);
      onUpdate(updated);
      setEditingEmail(false);
    } catch (error) {
      setErrorMessage((error as Error).message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }, [profile, email, onUpdate]);

  if (!profile) {
    return null;
  }

  const displayName = profile.nickname || profile.username;
  const avatarColor = getAvatarColor(profile.id);
  const displayInitial = getAvatarInitial(profile.username, profile.nickname);
  const fullAvatarUrl = getAvatarUrl(profile.avatar_url);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-auto">
        <DialogHeader>
          <DialogTitle>个人资料</DialogTitle>
        </DialogHeader>

        {/* 错误提示 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* 头像区域 */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {avatarPreview || fullAvatarUrl ? (
              <img
                src={avatarPreview || fullAvatarUrl || ""}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold border-4 border-gray-200"
                style={{ backgroundColor: avatarColor }}
              >
                {displayInitial}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            className="hidden"
            onChange={handleAvatarSelect}
            disabled={uploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="default"
            size="default"
            className="mt-3"
          >
            {uploading ? "上传中..." : "更换头像"}
          </Button>
        </div>

        {/* 用户名（只读） */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">用户名</div>
          <div className="text-base text-gray-800">{profile.username}</div>
        </div>

        {/* 角色（只读） */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">角色</div>
          <div className="text-base text-gray-800">{profile.role}</div>
        </div>

        {/* 昵称（可编辑） */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1 flex items-center justify-between">
            <span>昵称</span>
            {!editingNickname ? (
              <Button
                onClick={() => setEditingNickname(true)}
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-0 px-1 text-blue-500 hover:text-blue-600"
                disabled={saving}
              >
                编辑
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingNickname(false);
                    setNickname(profile.nickname || "");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0 px-1 text-gray-500 hover:text-gray-600"
                  disabled={saving}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSaveNickname}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0 px-1 text-blue-500 hover:text-blue-600"
                  disabled={saving}
                >
                  保存
                </Button>
              </div>
            )}
          </div>
          {editingNickname ? (
            <Input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
              disabled={saving}
            />
          ) : (
            <div className="text-base text-gray-800">
              {profile.nickname || "未设置"}
            </div>
          )}
        </div>

        {/* 邮箱（可编辑） */}
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-1 flex items-center justify-between">
            <span>邮箱</span>
            {!editingEmail ? (
              <Button
                onClick={() => setEditingEmail(true)}
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-0 px-1 text-blue-500 hover:text-blue-600"
                disabled={saving}
              >
                编辑
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingEmail(false);
                    setEmail(profile.email || "");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0 px-1 text-gray-500 hover:text-gray-600"
                  disabled={saving}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSaveEmail}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0 px-1 text-blue-500 hover:text-blue-600"
                  disabled={saving}
                >
                  保存
                </Button>
              </div>
            )}
          </div>
          {editingEmail ? (
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              disabled={saving}
            />
          ) : (
            <div className="text-base text-gray-800">
              {profile.email || "未设置"}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}

