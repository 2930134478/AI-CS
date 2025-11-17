"use client";

import { FormEvent, useEffect, useRef } from "react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  sending: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  sending,
}: MessageInputProps) {
  // 输入框引用，用于发送消息后自动聚焦
  const inputRef = useRef<HTMLInputElement>(null);
  // 记录上一次的 sending 状态，用于判断是否刚刚完成发送
  const prevSendingRef = useRef<boolean>(false);

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) {
      return;
    }
    await onSubmit();
    // 注意：聚焦逻辑由 useEffect 处理，当 sending 从 true 变为 false 时会自动聚焦
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 px-4 py-3 flex items-center gap-2 bg-white flex-shrink-0"
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="输入消息..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        disabled={sending}
      />
      <button
        type="submit"
        disabled={sending || !value.trim()}
        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-200 disabled:cursor-not-allowed"
      >
        {sending ? "发送中..." : "发送"}
      </button>
    </form>
  );
}

