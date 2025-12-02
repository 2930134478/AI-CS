package models

import (
	"time"
)

// FAQ 常见问题/事件记录模型
// 用于存储客服常见问题的问答记录
type FAQ struct {
	ID        uint      `json:"id" gorm:"primarykey"`
	Question  string    `json:"question" gorm:"type:text;not null"`           // 问题
	Answer    string    `json:"answer" gorm:"type:text;not null"`             // 答案
	Keywords  string    `json:"keywords" gorm:"type:varchar(500)"`            // 关键词，用逗号或空格分隔，用于搜索
	CreatedAt time.Time `json:"created_at"`                                   // 创建时间
	UpdatedAt time.Time `json:"updated_at"`                                   // 更新时间
}

