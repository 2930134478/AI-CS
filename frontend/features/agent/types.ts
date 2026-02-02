export interface LastMessage {
  id: number;
  content: string;
  sender_is_agent: boolean;
  message_type: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface ConversationSummary {
  id: number;
  conversation_type?: string; // "visitor" | "internal"
  visitor_id: number;
  agent_id: number;
  status: string;
  chat_mode?: string;
  created_at: string;
  updated_at: string;
  last_message?: LastMessage;
  unread_count?: number;
  last_seen_at?: string | null;
  has_participated?: boolean;
}

export interface MessageItem {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_is_agent: boolean;
  content: string;
  created_at: string;
  message_type?: string;
  chat_mode?: string; // 消息发送时的对话模式：human（人工客服）、ai（AI客服）
  is_read?: boolean;
  read_at?: string | null;
  // 文件相关字段（可选）
  file_url?: string | null;
  file_type?: string | null; // "image" | "document"
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
}

export interface ConversationDetail extends ConversationSummary {
  website?: string;
  referrer?: string;
  browser?: string;
  os?: string;
  language?: string;
  ip_address?: string;
  location?: string;
  email?: string;
  phone?: string;
  notes?: string;
  last_seen_at?: string | null;
}

export interface AgentUser {
  id: number;
  username: string;
  role: string;
}

// 个人资料信息
export interface Profile {
  id: number;
  username: string;
  role: string;
  avatar_url: string;
  nickname: string;
  email: string;
  receive_ai_conversations?: boolean; // 是否接收 AI 对话
}

export interface MessagesReadPayload {
  message_ids?: number[];
  read_at?: string;
  reader_is_agent?: boolean;
  conversation_id?: number;
  unread_count?: number;
}

export interface VisitorStatusUpdatePayload {
  conversation_id?: number;
  is_online?: boolean;
  visitor_count?: number;
}

export type ChatWebSocketPayload =
  | MessageItem
  | MessagesReadPayload
  | VisitorStatusUpdatePayload;

