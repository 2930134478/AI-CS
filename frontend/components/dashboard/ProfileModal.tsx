"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Profile } from "@/features/agent/types";
import {
  updateProfile as updateProfileApi,
  uploadAvatar as uploadAvatarApi,
  UpdateProfilePayload,
} from "@/features/agent/services/profileApi";
import { getAvatarUrl, getAvatarColor, getAvatarInitial } from "@/utils/avatar";

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

  if (!open || !profile) {
    return null;
  }

  const displayName = profile.nickname || profile.username;
  const avatarColor = getAvatarColor(profile.id);
  const displayInitial = getAvatarInitial(profile.username, profile.nickname);
  const fullAvatarUrl = getAvatarUrl(profile.avatar_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">个人资料</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            disabled={saving || uploading}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

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
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-3 px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "上传中..." : "更换头像"}
          </button>
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
              <button
                onClick={() => setEditingNickname(true)}
                className="text-blue-500 text-xs hover:text-blue-600"
                disabled={saving}
              >
                编辑
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingNickname(false);
                    setNickname(profile.nickname || "");
                  }}
                  className="text-gray-500 text-xs hover:text-gray-600"
                  disabled={saving}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveNickname}
                  className="text-blue-500 text-xs hover:text-blue-600"
                  disabled={saving}
                >
                  保存
                </button>
              </div>
            )}
          </div>
          {editingNickname ? (
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <button
                onClick={() => setEditingEmail(true)}
                className="text-blue-500 text-xs hover:text-blue-600"
                disabled={saving}
              >
                编辑
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingEmail(false);
                    setEmail(profile.email || "");
                  }}
                  className="text-gray-500 text-xs hover:text-gray-600"
                  disabled={saving}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEmail}
                  className="text-blue-500 text-xs hover:text-blue-600"
                  disabled={saving}
                >
                  保存
                </button>
              </div>
            )}
          </div>
          {editingEmail ? (
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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

        {/* 关闭按钮 */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            disabled={saving || uploading}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

