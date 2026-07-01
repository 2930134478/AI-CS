package models

import "time"

// DocumentChunk 文档分段
type DocumentChunk struct {
	ID              uint      `gorm:"primarykey" json:"id"`
	DocumentID      uint      `gorm:"index;not null" json:"document_id"`
	KnowledgeBaseID uint      `gorm:"index;not null" json:"knowledge_base_id"`
	ChunkIndex      int       `gorm:"not null" json:"chunk_index"`
	Content         string    `gorm:"type:text;not null" json:"content"`
	EmbeddingStatus string    `gorm:"type:varchar(20);default:'pending'" json:"embedding_status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
