package models

import "time"

// SystemLog 结构化系统日志（用于排障与日志中心展示）。
type SystemLog struct {
	ID             uint       `json:"id" gorm:"primaryKey"`
	Timestamp      time.Time  `json:"timestamp" gorm:"index"`
	Level          string     `json:"level" gorm:"type:varchar(20);index"`      // info / warn / error
	Category       string     `json:"category" gorm:"type:varchar(40);index"`   // http / ai / rag / business / system / frontend
	Event          string     `json:"event" gorm:"type:varchar(80);index"`      // 事件编码
	Source         string     `json:"source" gorm:"type:varchar(20);index"`     // backend / frontend
	TraceID        string     `json:"trace_id" gorm:"type:varchar(100);index"`
	ConversationID *uint      `json:"conversation_id" gorm:"index"`
	UserID         *uint      `json:"user_id" gorm:"index"`
	VisitorID      *uint      `json:"visitor_id" gorm:"index"`
	Message        string     `json:"message" gorm:"type:text"`
	MetaJSON       string     `json:"meta_json" gorm:"type:text"` // 扩展信息（JSON 字符串）
	CreatedAt      time.Time  `json:"created_at" gorm:"index"`
}

