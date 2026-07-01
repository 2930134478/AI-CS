"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { uploadFile, UploadFileResult } from "@/features/agent/services/messageApi";
import { updateVisitorContactEmail } from "@/features/visitor/services/conversationApi";
import {
  getVisitorContactEmail,
  saveVisitorContactEmail,
  saveVisitorEmailPromptDone,
  shouldShowVisitorEmailPrompt,
} from "@/lib/visitor-session";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Paperclip, ArrowUp, X } from "lucide-react";
import { toast } from "@/hooks/useToast";

interface VisitorMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (fileInfo?: UploadFileResult) => Promise<void> | void;
  sending: boolean;
  conversationId?: number;
  accessToken?: string;
  visitorId?: number;
  toolsSlot?: ReactNode;
  submitLeftSlot?: ReactNode;
}

interface FilePreview {
  file: File;
  preview?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function VisitorMessageInput({
  value,
  onChange,
  onSubmit,
  sending,
  conversationId,
  accessToken,
  visitorId,
  toolsSlot,
  submitLeftSlot,
}: VisitorMessageInputProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSendingRef = useRef<boolean>(false);
  const emailSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedEmailRef = useRef<string>("");

  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [contactExpanded, setContactExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [emailPromptActive, setEmailPromptActive] = useState(true);

  useEffect(() => {
    if (!visitorId) return;
    const saved = getVisitorContactEmail(visitorId);
    if (saved) {
      setEmail(saved);
      lastSavedEmailRef.current = saved;
    }
    setEmailPromptActive(shouldShowVisitorEmailPrompt(visitorId));
  }, [visitorId]);

  const dismissEmailPrompt = useCallback(() => {
    setContactExpanded(false);
    setEmailPromptActive(false);
    if (visitorId) {
      saveVisitorEmailPromptDone(visitorId);
    }
  }, [visitorId]);

  useEffect(() => {
    if (prevSendingRef.current && !sending && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    prevSendingRef.current = sending;
  }, [sending]);

  const persistEmail = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || !EMAIL_PATTERN.test(trimmed)) return;
      if (!conversationId) return;
      if (trimmed === lastSavedEmailRef.current) return;

      try {
        await updateVisitorContactEmail(conversationId, trimmed, accessToken);
        lastSavedEmailRef.current = trimmed;
        if (visitorId) {
          saveVisitorContactEmail(visitorId, trimmed);
        }
        dismissEmailPrompt();
      } catch (error) {
        console.warn("保存访客邮箱失败:", error);
      }
    },
    [accessToken, conversationId, visitorId, dismissEmailPrompt]
  );

  const scheduleEmailSave = useCallback(
    (raw: string) => {
      if (emailSaveTimerRef.current) {
        clearTimeout(emailSaveTimerRef.current);
      }
      emailSaveTimerRef.current = setTimeout(() => {
        void persistEmail(raw);
      }, 700);
    },
    [persistEmail]
  );

  useEffect(() => {
    if (!conversationId || !email.trim()) return;
    if (!EMAIL_PATTERN.test(email.trim())) return;
    scheduleEmailSave(email);
    return () => {
      if (emailSaveTimerRef.current) clearTimeout(emailSaveTimerRef.current);
    };
  }, [email, conversationId, scheduleEmailSave]);

  useEffect(() => {
    if (!conversationId || !email.trim()) return;
    if (!EMAIL_PATTERN.test(email.trim())) return;
    void persistEmail(email);
  }, [conversationId, email, persistEmail]);

  const handleFirstInteraction = useCallback(() => {
    if (!emailPromptActive) return;
    setContactExpanded((prev) => (prev ? prev : true));
  }, [emailPromptActive]);

  const handleFileSelect = useCallback(async (file: File) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("文件大小超过限制（最大10MB）");
      return;
    }

    const ext = file.name.toLowerCase().split(".").pop();
    const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "txt"];
    if (!ext || !allowedExts.includes(ext)) {
      toast.error("不支持的文件类型");
      return;
    }

    let preview: string | undefined;
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file);
    }
    setFilePreview({ file, preview });
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handleFileSelect(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    if (filePreview?.preview) URL.revokeObjectURL(filePreview.preview);
    setFilePreview(null);
  }, [filePreview]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending || uploading) return;
    if (!value.trim() && !filePreview) return;

    if (email.trim() && EMAIL_PATTERN.test(email.trim())) {
      await persistEmail(email);
    }

    try {
      let fileInfo: UploadFileResult | undefined;
      if (filePreview) {
        setUploading(true);
        try {
          fileInfo = await uploadFile(filePreview.file, conversationId, accessToken);
        } catch (error) {
          toast.error((error as Error).message || "文件上传失败");
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      await onSubmit(fileInfo);
      onChange("");
      handleRemoveFile();
      dismissEmailPrompt();
    } catch {
      // 发送异常由上层统一处理
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void handleFileSelect(file);
            break;
          }
        }
      }
    };
    const input = inputRef.current;
    if (!input) return;
    input.addEventListener("paste", handlePaste);
    return () => input.removeEventListener("paste", handlePaste);
  }, [handleFileSelect]);

  useEffect(() => {
    return () => {
      if (filePreview?.preview) URL.revokeObjectURL(filePreview.preview);
      if (emailSaveTimerRef.current) clearTimeout(emailSaveTimerRef.current);
    };
  }, [filePreview]);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] px-3 py-2"
    >
      {filePreview && (
        <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {filePreview.preview ? (
              <div className="inline-block">
                <img
                  src={filePreview.preview}
                  alt="预览"
                  className="max-w-[180px] max-h-[140px] rounded-lg object-cover border border-slate-200"
                />
                <div className="mt-1 text-xs text-slate-500">
                  {filePreview.file.name} ({formatFileSize(filePreview.file.size)})
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600">
                {filePreview.file.name} ({formatFileSize(filePreview.file.size)})
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            disabled={sending || uploading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {emailPromptActive && (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out",
            contactExpanded ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0 mb-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t("chat.email.placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => void persistEmail(email)}
                  className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none border-none px-1 py-0.5"
                  disabled={sending || uploading}
                />
                <span className="shrink-0 text-[10px] text-slate-400 tracking-wide">
                  {t("chat.email.optional")}
                </span>
              </div>
              <p className="mt-1 px-1 text-[10px] leading-snug text-slate-400">
                {t("chat.email.privacy")}
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        placeholder={filePreview ? "添加消息（可选）..." : t("chat.input.placeholder")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleFirstInteraction}
        onPaste={handleFirstInteraction}
        className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none border-none px-1"
        disabled={sending || uploading}
      />

      <div className="mt-2 flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            className="inline-flex items-center justify-center rounded-full w-8 h-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="上传文件"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          {toolsSlot}
        </div>
        <div className="flex items-center gap-2">
          {submitLeftSlot}
          <button
            type="submit"
            disabled={sending || uploading || (!value.trim() && !filePreview)}
            className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-blue-400 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={uploading ? "上传中" : sending ? "发送中" : "发送"}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
