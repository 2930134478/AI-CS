package models

import "time"

// EmailNotificationConfig 离线邮件通知配置（平台级单例 id=1）
type EmailNotificationConfig struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	Enabled             bool      `json:"enabled" gorm:"default:false"`
	SMTPHost            string    `json:"smtp_host" gorm:"type:varchar(255)"`
	SMTPPort            int       `json:"smtp_port" gorm:"default:465"`
	SMTPUser            string    `json:"smtp_user" gorm:"type:varchar(255)"`
	SMTPPassword        string    `json:"-" gorm:"type:varchar(1000)"` // 加密存储
	FromEmail           string    `json:"from_email" gorm:"type:varchar(255)"`
	FromName            string    `json:"from_name" gorm:"type:varchar(100)"`
	OfflineDelaySeconds int       `json:"offline_delay_seconds" gorm:"default:60"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
