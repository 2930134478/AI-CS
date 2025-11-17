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
  visitor_id: number;
  agent_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: LastMessage;
  unread_count?: number;
  last_seen_at?: string | null; // 最后活跃时间，用于判断在线状态
}

export interface MessageItem {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_is_agent: boolean;
  content: string;
  created_at: string;
  message_type?: string;
  is_read?: boolean;
  read_at?: string | null;
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

