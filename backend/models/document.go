package models

import (
	"time"
)

// Document 文档模型
type Document struct {
	ID              uint       `json:"id" gorm:"primarykey"`
	KnowledgeBaseID uint       `json:"knowledge_base_id" gorm:"index;not null"`
	Title           string     `json:"title" gorm:"type:varchar(255);not null"`
	Content         string     `json:"content" gorm:"type:text;not null"`
	Summary         string     `json:"summary" gorm:"type:text"` // 摘要
	Type            string     `json:"type" gorm:"type:varchar(50);default:'document'"` // 文档类型：document, url, file
	Status          string     `json:"status" gorm:"type:varchar(20);default:'draft'"` // 状态：draft（草稿）、published（已发布）
	EmbeddingStatus string     `json:"embedding_status" gorm:"type:varchar(20);default:'pending'"` // 向量化状态：pending（待处理）、processing（处理中）、completed（已完成）、failed（失败）
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
