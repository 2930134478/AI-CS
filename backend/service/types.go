package service

import "time"

// BroadcastHub 描述 WebSocket Hub 的广播能力。
type BroadcastHub interface {
	BroadcastMessage(conversationID uint, messageType string, data interface{})
}

// InitConversationInput 对话初始化需要的输入数据。
type InitConversationInput struct {
	VisitorID uint
	Website   string
	Referrer  string
	Browser   string
	OS        string
	Language  string
	IPAddress string
}

// InitConversationResult 对话初始化后的返回结果。
type InitConversationResult struct {
	ConversationID uint
	Status         string
}

// UpdateConversationContactInput 更新访客联系信息时需要的参数。
type UpdateConversationContactInput struct {
	ConversationID uint
	Email          *string
	Phone          *string
	Notes          *string
}

// ConversationSummary 用于会话列表展示的概要信息。
type ConversationSummary struct {
	ID          uint
	VisitorID   uint
	AgentID     uint
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	LastMessage *LastMessageSummary
	UnreadCount int64
	LastSeenAt  *time.Time // 最后活跃时间，用于判断在线状态
}

// LastMessageSummary 会话最后一条消息的摘要信息。
type LastMessageSummary struct {
	ID            uint
	Content       string
	SenderIsAgent bool
	MessageType   string
	IsRead        bool
	ReadAt        *time.Time
	CreatedAt     time.Time
}

// ConversationDetail 在会话概要基础上附加访客信息。
type ConversationDetail struct {
	ConversationSummary
	Website   string
	Referrer  string
	Browser   string
	OS        string
	Language  string
	IPAddress string
	Location  string
	Email     string
	Phone     string
	Notes     string
	LastSeen  *time.Time
}

// CreateMessageInput 创建消息时需要的参数。
type CreateMessageInput struct {
	ConversationID uint
	Content        string
	SenderID       uint
	SenderIsAgent  bool
}

// CreateAgentInput 创建客服或管理员账号需要的参数。
type CreateAgentInput struct {
	Username string
	Password string
	Role     string
}

// MarkMessagesReadResult 消息标记已读后的返回信息。
type MarkMessagesReadResult struct {
	ConversationID uint
	MessageIDs     []uint
	UnreadCount    int64
	ReadAt         time.Time
}

// UpdateProfileInput 更新个人资料时需要的参数。
type UpdateProfileInput struct {
	UserID   uint
	Nickname *string
	Email    *string
}

// ProfileResult 个人资料信息。
type ProfileResult struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	AvatarURL string `json:"avatar_url"`
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
}
