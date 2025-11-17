"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  UpdateProfilePayload,
} from "../../agent/services/profileApi";
import { Profile } from "../../agent/types";

interface UseProfileOptions {
  userId: number | null;
  enabled?: boolean;
}

export function useProfile({ userId, enabled = true }: UseProfileOptions) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 加载个人资料
  const loadProfile = useCallback(async () => {
    if (!userId || !enabled) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error("获取个人资料失败:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  // 初始化时加载个人资料
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // 更新个人资料
  const update = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!userId) {
        throw new Error("用户ID不能为空");
      }
      setUpdating(true);
      try {
        const updated = await updateProfile(userId, payload);
        setProfile(updated);
        return updated;
      } finally {
        setUpdating(false);
      }
    },
    [userId]
  );

  // 上传头像
  const upload = useCallback(
    async (file: File) => {
      if (!userId) {
        throw new Error("用户ID不能为空");
      }
      setUploading(true);
      try {
        const updated = await uploadAvatar(userId, file);
        setProfile(updated);
        return updated;
      } finally {
        setUploading(false);
      }
    },
    [userId]
  );

  // 刷新个人资料
  const refresh = useCallback(() => {
    return loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    updating,
    uploading,
    update,
    upload,
    refresh,
  };
}

