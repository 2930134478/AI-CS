package models

import (
	"time"
)

// KnowledgeBase 知识库模型
type KnowledgeBase struct {
	ID             uint      `json:"id" gorm:"primarykey"`
	Name           string    `json:"name" gorm:"type:varchar(255);not null"`
	Description    string    `json:"description" gorm:"type:text"`
	DocumentCount  int       `json:"document_count" gorm:"default:0"`  // 文档数量（缓存字段）
	RAGEnabled     bool      `json:"rag_enabled" gorm:"default:true"` // 是否参与 RAG：开启时该知识库下的已发布文档会被 AI 引用
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
