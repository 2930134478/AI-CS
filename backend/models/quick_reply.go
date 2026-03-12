package models

import (
	"time"
)

// QuickReply 快捷回复模板模型
// 用于存储客服常用的回复模板，支持个人模板和公共模板
type QuickReply struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     *uint     `json:"user_id" gorm:"index"`              // 所属用户ID（null表示公共模板）
	Title      string    `json:"title" gorm:"type:varchar(100)"`    // 模板标题/快捷键
	Content    string    `json:"content" gorm:"type:text;not null"` // 模板内容
	Category   string    `json:"category" gorm:"type:varchar(50)"`  // 分类（如：问候、常见问题、结束语等）
	SortOrder  int       `json:"sort_order" gorm:"default:0"`       // 排序（数值越小越靠前）
	UsageCount int       `json:"usage_count" gorm:"default:0"`      // 使用次数统计
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// TableName 指定表名
func (QuickReply) TableName() string {
	return "quick_replies"
}
