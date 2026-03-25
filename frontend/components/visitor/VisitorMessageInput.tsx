"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { uploadFile, UploadFileResult } from "@/features/agent/services/messageApi";
import { Paperclip, ArrowUp, X } from "lucide-react";
import { toast } from "@/hooks/useToast";

interface VisitorMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (fileInfo?: UploadFileResult) => Promise<void> | void;
  sending: boolean;
  conversationId?: number;
  toolsSlot?: ReactNode;
  submitLeftSlot?: ReactNode;
}

interface FilePreview {
  file: File;
  preview?: string;
}

export function VisitorMessageInput({
  value,
  onChange,
  onSubmit,
  sending,
  conversationId,
  toolsSlot,
  submitLeftSlot,
}: VisitorMessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSendingRef = useRef<boolean>(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (prevSendingRef.current && !sending && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    prevSendingRef.current = sending;
  }, [sending]);

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

    try {
      let fileInfo: UploadFileResult | undefined;
      if (filePreview) {
        setUploading(true);
        try {
          fileInfo = await uploadFile(filePreview.file, conversationId);
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
    } catch (error) {
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
    };
  }, [filePreview]);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] px-3 py-2">
      {filePreview && (
        <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {filePreview.preview ? (
              <div className="inline-block">
                <img src={filePreview.preview} alt="预览" className="max-w-[180px] max-h-[140px] rounded-lg object-cover border border-slate-200" />
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

      <input
        ref={inputRef}
        type="text"
        placeholder={filePreview ? "添加消息（可选）..." : "输入消息"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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

