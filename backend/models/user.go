package models

import (
	"time"
)

type User struct {
	ID        uint   `json:"id" gorm:"primarykey"`
	Username  string `json:"username" gorm:"unique"`
	Password  string `json:"password"`
	Role      string `json:"role"`
	AvatarURL string `json:"avatar_url" gorm:"type:varchar(500)"` // 头像URL
	Nickname  string `json:"nickname" gorm:"type:varchar(100)"`   // 昵称
	Email     string `json:"email" gorm:"type:varchar(255)"`      // 邮箱
	// AI 对话接收设置
	ReceiveAIConversations bool      `json:"receive_ai_conversations" gorm:"default:true"` // 是否接收 AI 对话（默认接收）
	CreatedAt              time.Time `json:"created_at"`                                   // 创建时间
	UpdatedAt              time.Time `json:"updated_at"`                                   // 更新时间
}

type Conversation struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	ConversationType string    `json:"conversation_type" gorm:"type:varchar(20);default:'visitor'"` // visitor（访客对话）、internal（内部/知识库测试）
	VisitorID        uint      `json:"visitor_id"`
	AgentID          uint      `json:"agent_id"`
	Status           string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	// 访客信息字段（自动收集）
	Website   string `json:"website" gorm:"type:varchar(500)"`   // 网站（当前页面URL）
	Referrer  string `json:"referrer" gorm:"type:varchar(500)"`  // 来源（referrer）
	Browser   string `json:"browser" gorm:"type:varchar(100)"`   // 浏览器信息
	OS        string `json:"os" gorm:"type:varchar(100)"`        // 操作系统
	Language  string `json:"language" gorm:"type:varchar(50)"`   // 语言
	IPAddress string `json:"ip_address" gorm:"type:varchar(50)"` // IP地址
	Location  string `json:"location" gorm:"type:varchar(200)"`  // 位置
	// 联系信息字段（客服手动添加）
	Email string `json:"email" gorm:"type:varchar(255)"` // 邮箱
	Phone string `json:"phone" gorm:"type:varchar(50)"`  // 电话
	Notes string `json:"notes" gorm:"type:text"`         // 备注
	// 在线状态
	LastSeenAt *time.Time `json:"last_seen_at"` // 最后活跃时间
	// AI 客服相关
	ChatMode   string `json:"chat_mode" gorm:"type:varchar(20);default:'human'"` // 对话模式：human（人工客服）、ai（AI客服）
	AIConfigID *uint  `json:"ai_config_id"`                                      // AI 配置 ID（访客选择的模型配置）
}

type Message struct {
	ID             uint       `json:"id" gorm:"primarykey"`
	ConversationID uint       `json:"conversation_id"`
	SenderID       uint       `json:"sender_id"`
	SenderIsAgent  bool       `json:"sender_is_agent"`
	Content        string     `json:"content" gorm:"type:text"`
	MessageType    string     `json:"message_type" gorm:"type:varchar(20);default:'user_message'"` // 消息类型：user_message, system_message
	ChatMode       string     `json:"chat_mode" gorm:"type:varchar(20);default:'human'"`           // 消息发送时的对话模式：human（人工客服）、ai（AI客服）
	IsRead         bool       `json:"is_read"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	// 文件相关字段（可选）
	FileURL  *string `json:"file_url" gorm:"type:varchar(500)"`  // 文件URL（相对路径或完整URL）
	FileType *string `json:"file_type" gorm:"type:varchar(50)"`  // 文件类型：image, document
	FileName *string `json:"file_name" gorm:"type:varchar(255)"` // 原始文件名
	FileSize *int64  `json:"file_size"`                          // 文件大小（字节）
	MimeType *string `json:"mime_type" gorm:"type:varchar(100)"` // MIME类型（如 image/jpeg）
}
