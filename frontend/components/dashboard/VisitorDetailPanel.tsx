"use client";

import { useMemo, useState } from "react";

import { ConversationDetail, ConversationSummary } from "@/features/agent/types";
import {
  formatConversationTime,
  isVisitorOnline,
} from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <div className="w-80 bg-background border-l border-border flex flex-col min-h-0">
      <div className="h-16 flex items-center justify-between px-4 flex-shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {conversation.visitor_id.toString().slice(-2)}
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm">
              访客 #{conversation.visitor_id}
            </div>
            <div className="text-xs text-muted-foreground">
              {isOnline ? (
                <span className="text-green-600">● 在线</span>
              ) : (
                <span className="text-muted-foreground">● 离线</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
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
          </Button>
          <Button
            variant="ghost"
            size="icon"
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
          </Button>
        </div>
      </div>
      <Separator className="absolute bottom-0 left-0 right-0" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-auto">
        {/* 联系信息区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">联系信息</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500 mb-1 text-xs flex items-center justify-between">
                <span>邮箱</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0 px-1 text-blue-500 hover:text-blue-600"
                  onClick={() => handleOpenEditor("email")}
                >
                  {actionLabel("email")}
                </Button>
              </div>
              <div className="text-xs text-gray-700 break-all">
                {displayValue(detail?.email, "暂未填写")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs flex items-center justify-between">
                <span>电话</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0 px-1 text-blue-500 hover:text-blue-600"
                  onClick={() => handleOpenEditor("phone")}
                >
                  {actionLabel("phone")}
                </Button>
              </div>
              <div className="text-xs text-gray-700 break-all">
                {displayValue(detail?.phone, "暂未填写")}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1 text-xs flex items-center justify-between">
                <span>备注</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0 px-1 text-blue-500 hover:text-blue-600"
                  onClick={() => handleOpenEditor("notes")}
                >
                  {actionLabel("notes")}
                </Button>
              </div>
              <div className="text-xs text-gray-700 whitespace-pre-wrap break-words min-h-[1rem]">
                {displayValue(detail?.notes, "暂无备注")}
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* 技术信息区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">技术信息</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingField} onOpenChange={() => !saving && handleCloseEditor()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>编辑{editingField ? fieldLabels[editingField] : ""}</DialogTitle>
          </DialogHeader>
          {editingField === "notes" ? (
            <Textarea
              className="w-full resize-none h-32"
              value={editingValue}
              onChange={(event) => setEditingValue(event.target.value)}
              placeholder={`请输入${editingField ? fieldLabels[editingField] : ""}`}
            />
          ) : (
            <Input
              type="text"
              value={editingValue}
              onChange={(event) => setEditingValue(event.target.value)}
              placeholder={`请输入${editingField ? fieldLabels[editingField] : ""}`}
            />
          )}
          {errorMessage && (
            <div className="text-xs text-red-500 mt-2">{errorMessage}</div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseEditor}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

