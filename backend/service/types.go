package service

import "time"

// BroadcastHub 描述 WebSocket Hub 的广播能力。
type BroadcastHub interface {
	BroadcastMessage(conversationID uint, messageType string, data interface{})
	BroadcastToAllAgents(messageType string, data interface{})
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
	ChatMode   string // 对话模式：human（人工客服）、ai（AI客服）
	AIConfigID *uint  // AI 配置 ID（访客选择的模型配置，AI 模式时必需）
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
	ID               uint
	ConversationType string // visitor | internal
	VisitorID        uint
	AgentID          uint
	Status           string
	ChatMode         string // human | ai
	CreatedAt        time.Time
	UpdatedAt        time.Time
	LastMessage      *LastMessageSummary
	UnreadCount      int64
	LastSeenAt       *time.Time // 最后活跃时间，用于判断在线状态
	HasParticipated  bool       // 当前用户是否参与过该会话（是否发送过消息）
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
	// 文件相关字段（可选）
	FileURL  *string // 文件URL
	FileType *string // 文件类型：image, document
	FileName *string // 原始文件名
	FileSize *int64  // 文件大小（字节）
	MimeType *string // MIME类型
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
	UserID                 uint
	Nickname               *string
	Email                  *string
	ReceiveAIConversations *bool // 是否接收 AI 对话（可选）
}

// ProfileResult 个人资料信息。
type ProfileResult struct {
	ID                     uint   `json:"id"`
	Username               string `json:"username"`
	Role                   string `json:"role"`
	AvatarURL              string `json:"avatar_url"`
	Nickname               string `json:"nickname"`
	Email                  string `json:"email"`
	ReceiveAIConversations bool   `json:"receive_ai_conversations"` // 是否接收 AI 对话
}

// UserSummary 用户列表摘要信息（不包含密码）。
type UserSummary struct {
	ID                     uint      `json:"id"`
	Username               string    `json:"username"`
	Role                   string    `json:"role"`
	Nickname               string    `json:"nickname"`
	Email                  string    `json:"email"`
	AvatarURL              string    `json:"avatar_url"`
	ReceiveAIConversations bool      `json:"receive_ai_conversations"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

// CreateUserInput 创建用户输入。
type CreateUserInput struct {
	Username string  // 用户名（必需）
	Password string  // 密码（必需）
	Role     string  // 角色："admin" 或 "agent"（必需）
	Nickname *string // 昵称（可选）
	Email    *string // 邮箱（可选）
}

// UpdateUserInput 更新用户输入。
type UpdateUserInput struct {
	UserID                 uint    // 用户ID（必需）
	Role                   *string // 角色（可选）
	Nickname               *string // 昵称（可选）
	Email                  *string // 邮箱（可选）
	ReceiveAIConversations *bool   // 是否接收 AI 对话（可选）
}

// UpdatePasswordInput 更新密码输入。
type UpdatePasswordInput struct {
	UserID      uint    // 用户ID（必需）
	OldPassword *string // 旧密码（可选，管理员修改其他用户密码时不需要）
	NewPassword string  // 新密码（必需）
	IsAdmin     bool    // 是否是管理员操作（必需）
}

// FAQSummary FAQ（常见问题）摘要信息。
type FAQSummary struct {
	ID        uint      `json:"id"`
	Question  string    `json:"question"`  // 问题
	Answer    string    `json:"answer"`    // 答案
	Keywords  string    `json:"keywords"`  // 关键词（用于搜索）
	CreatedAt time.Time `json:"created_at"` // 创建时间
	UpdatedAt time.Time `json:"updated_at"` // 更新时间
}

// CreateFAQInput 创建 FAQ 输入。
type CreateFAQInput struct {
	Question string // 问题（必需）
	Answer   string // 答案（必需）
	Keywords string // 关键词（可选，用逗号或空格分隔）
}

// UpdateFAQInput 更新 FAQ 输入。
type UpdateFAQInput struct {
	Question *string // 问题（可选）
	Answer   *string // 答案（可选）
	Keywords *string // 关键词（可选）
}

// OnlineAgent 在线客服信息（供访客查看）。
type OnlineAgent struct {
	ID        uint   `json:"id"`         // 客服ID
	Nickname  string `json:"nickname"`   // 昵称
	AvatarURL string `json:"avatar_url"` // 头像URL
}

// DocumentSummary 文档摘要信息。
type DocumentSummary struct {
	ID               uint      `json:"id"`
	KnowledgeBaseID  uint      `json:"knowledge_base_id"`
	Title            string    `json:"title"`
	Content          string    `json:"content"`
	Summary          string    `json:"summary"`
	Type             string    `json:"type"`
	Status           string    `json:"status"`
	EmbeddingStatus  string    `json:"embedding_status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CreateDocumentInput 创建文档输入。
type CreateDocumentInput struct {
	KnowledgeBaseID uint            // 知识库 ID（必需）
	Title           string          // 文档标题（必需）
	Content         string          // 文档内容（必需）
	Summary         string          // 文档摘要（可选）
	Type            string          // 文档类型（可选，默认：document）
	Status          string          // 文档状态（可选，默认：draft）
	Metadata        map[string]interface{} // 元数据（可选）
}

// UpdateDocumentInput 更新文档输入。
type UpdateDocumentInput struct {
	Title    *string                 // 文档标题（可选）
	Content  *string                 // 文档内容（可选）
	Summary  *string                 // 文档摘要（可选）
	Type     *string                 // 文档类型（可选）
	Status   *string                 // 文档状态（可选）
	Metadata *map[string]interface{} // 元数据（可选）
}

// DocumentListResult 文档列表查询结果。
type DocumentListResult struct {
	Documents []DocumentSummary `json:"documents"`   // 文档列表
	Total     int64             `json:"total"`       // 总记录数
	Page      int               `json:"page"`       // 当前页码
	PageSize  int               `json:"page_size"`  // 每页大小
	TotalPage int               `json:"total_page"` // 总页数
}

// KnowledgeBaseSummary 知识库摘要信息。
type KnowledgeBaseSummary struct {
	ID             uint      `json:"id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	DocumentCount  int64     `json:"document_count"` // 文档数量（统计信息）
	RAGEnabled     bool      `json:"rag_enabled"`    // 是否参与 RAG（对 AI 开放）
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// CreateKnowledgeBaseInput 创建知识库输入。
type CreateKnowledgeBaseInput struct {
	Name        string // 知识库名称（必需）
	Description string // 知识库描述（可选）
}

// UpdateKnowledgeBaseInput 更新知识库输入。
type UpdateKnowledgeBaseInput struct {
	Name        *string // 知识库名称（可选）
	Description *string // 知识库描述（可选）
	RAGEnabled  *bool   // 是否参与 RAG（可选）
}

// QuickReplySummary 快捷回复模板摘要信息。
type QuickReplySummary struct {
	ID         uint      `json:"id"`
	UserID     *uint     `json:"user_id"`     // 所属用户ID（null表示公共模板）
	Title      string    `json:"title"`       // 模板标题
	Content    string    `json:"content"`     // 模板内容
	Category   string    `json:"category"`    // 分类
	SortOrder  int       `json:"sort_order"`  // 排序
	UsageCount int       `json:"usage_count"` // 使用次数
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// CreateQuickReplyInput 创建快捷回复模板输入。
type CreateQuickReplyInput struct {
	UserID    *uint   // 所属用户ID（nil表示公共模板，仅管理员可创建）
	Title     string  // 模板标题（可选，不填则自动取内容前20字）
	Content   string  // 模板内容（必需）
	Category  string  // 分类（可选）
	SortOrder int     // 排序（可选）
}

// UpdateQuickReplyInput 更新快捷回复模板输入。
type UpdateQuickReplyInput struct {
	Title     *string // 模板标题（可选）
	Content   *string // 模板内容（可选）
	Category  *string // 分类（可选）
	SortOrder *int    // 排序（可选）
}

// DashboardStats Dashboard 概览统计数据。
type DashboardStats struct {
	TodayConversations int64 `json:"today_conversations"` // 今日对话数
	TodayMessages      int64 `json:"today_messages"`      // 今日消息数
	OnlineAgents       int64 `json:"online_agents"`       // 在线客服数
	ActiveVisitors     int64 `json:"active_visitors"`     // 活跃访客数
	TotalConversations int64 `json:"total_conversations"` // 总对话数
	TotalMessages      int64 `json:"total_messages"`      // 总消息数
}

// ConversationTrendData 对话趋势数据。
type ConversationTrendData struct {
	Date          string `json:"date"`           // 日期
	Count         int64  `json:"count"`          // 对话数
	MessageCount  int64  `json:"message_count"`  // 消息数
	VisitorCount  int64  `json:"visitor_count"`  // 访客数
}

// AgentWorkloadData 客服工作量数据。
type AgentWorkloadData struct {
	AgentID           uint   `json:"agent_id"`
	AgentName         string `json:"agent_name"`
	ConversationCount int64  `json:"conversation_count"` // 对话数
	MessageCount      int64  `json:"message_count"`      // 消息数
	AvgResponseTime   int64  `json:"avg_response_time"`  // 平均响应时间（秒）
}

// VisitorSourceData 访客来源数据。
type VisitorSourceData struct {
	Source string `json:"source"` // 来源
	Count  int64  `json:"count"`  // 数量
}

// AIStatsData AI 统计数据。
type AIStatsData struct {
	TotalAIResponses  int64   `json:"total_ai_responses"`  // AI 总回复数
	AIResponseRate    float64 `json:"ai_response_rate"`    // AI 回复率
	AvgResponseTime   int64   `json:"avg_response_time"`   // 平均响应时间（毫秒）
	HumanTakeoverRate float64 `json:"human_takeover_rate"` // 人工接管率
}
