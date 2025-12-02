"use client";

import { FormEvent, useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFile, UploadFileResult } from "@/features/agent/services/messageApi";
import { X, Paperclip, Image as ImageIcon } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (fileInfo?: UploadFileResult) => Promise<void> | void;
  sending: boolean;
  conversationId?: number; // 对话ID，用于文件上传
}

interface FilePreview {
  file: File;
  preview?: string; // 图片预览URL
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  sending,
  conversationId,
}: MessageInputProps) {
  // 输入框引用，用于发送消息后自动聚焦
  const inputRef = useRef<HTMLInputElement>(null);
  // 文件输入框引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 记录上一次的 sending 状态，用于判断是否刚刚完成发送
  const prevSendingRef = useRef<boolean>(false);
  // 文件预览状态
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  // 上传中状态
  const [uploading, setUploading] = useState(false);

  // 当发送状态从 true 变为 false 时（发送完成），自动聚焦到输入框
  useEffect(() => {
    // 如果上一次是发送中（true），现在是发送完成（false），说明刚刚发送完成
    if (prevSendingRef.current && !sending && inputRef.current) {
      // 使用 setTimeout 确保 DOM 更新完成后再聚焦
      // 这样可以避免在某些情况下聚焦失败
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
    // 更新上一次的 sending 状态
    prevSendingRef.current = sending;
  }, [sending]);

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (file: File) => {
      // 验证文件大小（10MB）
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        alert("文件大小超过限制（最大10MB）");
        return;
      }

      // 验证文件类型
      const ext = file.name.toLowerCase().split(".").pop();
      const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "txt"];
      if (!ext || !allowedExts.includes(ext)) {
        alert("不支持的文件类型");
        return;
      }

      // 如果是图片，生成预览
      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      setFilePreview({ file, preview });
    },
    []
  );

  // 处理文件输入框变化
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // 清空文件输入框，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  // 处理拖拽上传
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 处理粘贴图片
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
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener("paste", handlePaste);
      return () => {
        input.removeEventListener("paste", handlePaste);
      };
    }
  }, [handleFileSelect]);

  // 移除文件预览
  const handleRemoveFile = useCallback(() => {
    if (filePreview?.preview) {
      URL.revokeObjectURL(filePreview.preview);
    }
    setFilePreview(null);
  }, [filePreview]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // 处理提交
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending || uploading) {
      return;
    }

    // 验证：必须有内容或文件
    if (!value.trim() && !filePreview) {
      return;
    }

    try {
      let fileInfo: UploadFileResult | undefined;

      // 如果有文件，先上传文件
      if (filePreview) {
        setUploading(true);
        try {
          fileInfo = await uploadFile(filePreview.file, conversationId);
        } catch (error) {
          alert((error as Error).message || "文件上传失败");
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // 发送消息（包含文件信息）
      await onSubmit(fileInfo);

      // 清空输入和文件预览
      onChange("");
      handleRemoveFile();
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  };

  // 清理预览URL
  useEffect(() => {
    return () => {
      if (filePreview?.preview) {
        URL.revokeObjectURL(filePreview.preview);
      }
    };
  }, [filePreview]);

  return (
    <div
      className="bg-gradient-to-t from-background to-muted/30 flex-shrink-0 border-t border-border/50"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 文件预览区域 */}
      {filePreview && (
        <div className="px-4 pt-3 pb-2 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {filePreview.preview ? (
              // 图片预览
              <div className="relative inline-block">
                <img
                  src={filePreview.preview}
                  alt="预览"
                  className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border shadow-sm"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  {filePreview.file.name} ({formatFileSize(filePreview.file.size)})
                </div>
              </div>
            ) : (
              // 文档预览
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{filePreview.file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(filePreview.file.size)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
            disabled={sending || uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="px-4 py-3 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading}
          title="上传文件"
          className="hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Input
          ref={inputRef}
          type="text"
          placeholder={filePreview ? "添加消息（可选）..." : "输入消息..."}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 border-border/50 focus:border-primary/50 focus:ring-primary/20"
          disabled={sending || uploading}
        />
        <Button
          type="submit"
          disabled={sending || uploading || (!value.trim() && !filePreview)}
          variant="default"
          size="default"
          className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
        >
          {uploading ? "上传中..." : sending ? "发送中..." : "发送"}
        </Button>
      </form>
    </div>
  );
}
