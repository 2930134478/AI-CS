package models

import (
	"time"
)

// FAQ 常见问题/事件记录模型
// 用于存储客服常见问题的问答记录
type FAQ struct {
	ID               uint       `json:"id" gorm:"primarykey"`
	Question         string     `json:"question" gorm:"type:text;not null"`                    // 问题
	Answer           string     `json:"answer" gorm:"type:text;not null"`                      // 答案
	Keywords         string     `json:"keywords" gorm:"type:varchar(500)"`                     // 关键词，用逗号或空格分隔，用于搜索
	VectorID         *string    `json:"vector_id" gorm:"type:varchar(255);index"`              // Milvus 向量 ID（用于向量检索）
	EmbeddingStatus  string     `json:"embedding_status" gorm:"type:varchar(20);default:'pending'"` // 向量化状态：pending（待处理）、processing（处理中）、completed（已完成）、failed（失败）
	KnowledgeBaseID  *uint      `json:"knowledge_base_id" gorm:"index"`                        // 所属知识库 ID（可选，用于知识库分类）
	CreatedAt        time.Time  `json:"created_at"`                                            // 创建时间
	UpdatedAt        time.Time  `json:"updated_at"`                                            // 更新时间
}

