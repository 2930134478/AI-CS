package models

import "time"

// WidgetOpenEvent 访客打开客服小窗埋点（每次打开弹窗记一条，用于统计访问次数）
type WidgetOpenEvent struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	VisitorID uint      `json:"visitor_id" gorm:"index;not null"`
	CreatedAt time.Time `json:"created_at"`
}

func (WidgetOpenEvent) TableName() string {
	return "widget_open_events"
}
