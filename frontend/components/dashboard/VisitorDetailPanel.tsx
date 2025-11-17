"use client";

import { useMemo, useState } from "react";

import { ConversationDetail, ConversationSummary } from "@/features/agent/types";
import {
  formatConversationTime,
  isVisitorOnline,
} from "@/utils/format";

type ContactField = "email" | "phone" | "notes";
type ContactUpdatePayload = Partial<Record<ContactField, string>>;

interface VisitorDetailPanelProps {
  conversation: ConversationSummary | null;
  detail: ConversationDetail | null;
  onRefresh: () => void;
  onUpdateContact: (payload: ContactUpdatePayload) => Promise<unknown>;
}

const displayValue = (value?: string | null, placeholder = "暂未填写") => {
  if (!value) {
    return placeholder;
  }
  const trimmed = value.trim();
  return trimmed || placeholder;
};

export function VisitorDetailPanel({
  conversation,
  detail,
  onRefresh,
  onUpdateContact,
}: VisitorDetailPanelProps) {
  const [editingField, setEditingField] = useState<ContactField | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fieldLabels = useMemo<Record<ContactField, string>>(
    () => ({
      email: "邮箱",
      phone: "电话",
      notes: "备注",
    }),
    []
  );
  if (!conversation) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col min-h-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 text-sm">
            选择一个对话查看详情
          </div>
        </div>
      </div>
    );
  }

  const avatarColor = `hsl(${(conversation.visitor_id * 137.5) % 360}, 70%, 50%)`;
  // 根据 last_seen_at 判断是否在线（优先使用 detail，因为它是最新的）
  // 如果 detail 不存在，使用 conversation.last_seen_at
  const isOnline = isVisitorOnline(
    detail?.last_seen_at ?? conversation.last_seen_at ?? null
  );

  const getFieldValue = (field: ContactField) => {
    if (!detail) {
      return "";
    }
    switch (field) {
      case "email":
        return detail.email ?? "";
      case "phone":
        return detail.phone ?? "";
      case "notes":
        return detail.notes ?? "";
      default:
        return "";
    }
  };

  const handleOpenEditor = (field: ContactField) => {
    setEditingField(field);
    setEditingValue(getFieldValue(field));
    setErrorMessage("");
  };

  const handleCloseEditor = () => {
    if (saving) {
      return;
    }
    setEditingField(null);
    setEditingValue("");
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!editingField) {
      return;
    }
    setSaving(true);
    try {
      const payload: ContactUpdatePayload = {
        [editingField]: editingValue,
      };
      await onUpdateContact(payload);
      setEditingField(null);
      setEditingValue("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage((error as Error).message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = (field: ContactField) => {
    const current = getFieldValue(field).trim();
    return current ? "编辑" : "+ Add";
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col min-h-0">
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {conversation.visitor_id.toString().slice(-2)}
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">
              访客 #{conversation.visitor_id}
            </div>
            <div className="text-xs text-gray-500">
              {isOnline ? (
                <span className="text-green-600">● 在线</span>
              ) : (
                <span className="text-gray-400">● 离线</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            title="刷新"
            onClick={onRefresh}
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            title="更多选项"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* 联系信息区域 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">联系信息</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500 mb-1 text-xs flex items-center justify-between">
                <span>邮箱</span>
                <button
                  className="text-blue-500 text-xs hover:text-blue-600"
                  onClick={() => handleOpenEditor("email")}
                >
                  {actionLabel("email")}
                </button>
              </div>
              <div className="text-xs text-gray-700 break-all">
                {displayValue(detail?.email, "暂未填写")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs flex items-center justify-between">
                <span>电话</span>
                <button
                  className="text-blue-500 text-xs hover:text-blue-600"
                  onClick={() => handleOpenEditor("phone")}
                >
                  {actionLabel("phone")}
                </button>
              </div>
              <div className="text-xs text-gray-700 break-all">
                {displayValue(detail?.phone, "暂未填写")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs flex items-center justify-between">
                <span>备注</span>
                <button
                  className="text-blue-500 text-xs hover:text-blue-600"
                  onClick={() => handleOpenEditor("notes")}
                >
                  {actionLabel("notes")}
                </button>
              </div>
              <div className="text-xs text-gray-700 whitespace-pre-wrap break-words min-h-[1rem]">
                {displayValue(detail?.notes, "暂无备注")}
              </div>
            </div>
          </div>
        </div>

        {/* 技术信息区域 */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">技术信息</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500 mb-1 text-xs">网站</div>
              {detail?.website ? (
                <a
                  href={detail.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 break-all hover:underline"
                >
                  {detail.website}
                </a>
              ) : (
                <div className="text-gray-400 text-xs">暂未收集</div>
              )}
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs">来源</div>
              {detail?.referrer ? (
                <a
                  href={detail.referrer}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 break-all hover:underline"
                >
                  {detail.referrer}
                </a>
              ) : (
                <div className="text-gray-400 text-xs">暂无来源信息</div>
              )}
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs">语言</div>
              <div className="text-gray-700 text-xs">
                {displayValue(detail?.language, "暂未收集")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs">浏览器</div>
              <div className="text-gray-700 text-xs">
                {displayValue(detail?.browser, "暂未收集")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs">操作系统</div>
              <div className="text-gray-700 text-xs">
                {displayValue(detail?.os, "暂未收集")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs">IP 地址</div>
              <div className="text-gray-700 text-xs">
                {displayValue(detail?.ip_address, "暂未收集")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs">位置</div>
              <div className="text-gray-700 text-xs">
                {displayValue(detail?.location, "暂未收集")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs">最后活跃</div>
              <div className="text-gray-700 text-xs">
                {detail?.last_seen_at
                  ? formatConversationTime(detail.last_seen_at)
                  : "未知"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              编辑{fieldLabels[editingField]}
            </h3>
            {editingField === "notes" ? (
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-32"
                value={editingValue}
                onChange={(event) => setEditingValue(event.target.value)}
                placeholder={`请输入${fieldLabels[editingField]}`}
              />
            ) : (
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editingValue}
                onChange={(event) => setEditingValue(event.target.value)}
                placeholder={`请输入${fieldLabels[editingField]}`}
              />
            )}
            {errorMessage && (
              <div className="text-xs text-red-500 mt-2">{errorMessage}</div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={handleCloseEditor}
                disabled={saving}
              >
                取消
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

