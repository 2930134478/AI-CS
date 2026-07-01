package models

import "time"

// OfflineEmailJob 访客离线时延迟发送的邮件任务
type OfflineEmailJob struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	ConversationID uint      `json:"conversation_id" gorm:"index;not null"`
	MessageIDs     string    `json:"message_ids" gorm:"type:varchar(2000);not null"` // 逗号分隔的消息 ID
	ScheduledAt    time.Time `json:"scheduled_at" gorm:"index;not null"`
	Status         string    `json:"status" gorm:"type:varchar(20);default:'pending';index"` // pending/sent/cancelled/failed
	LastError      string    `json:"last_error" gorm:"type:text"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
