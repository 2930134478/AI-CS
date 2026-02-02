package models

import "time"

// EmbeddingConfig 知识库向量模型配置（平台级单例，仅一条有效记录）
// 用于文档向量化与 RAG 检索，在前端「设置 - 知识库向量模型」中配置
type EmbeddingConfig struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	EmbeddingType       string    `json:"embedding_type" gorm:"type:varchar(50);default:'openai'"`   // openai / bge / local
	APIURL              string    `json:"api_url" gorm:"type:varchar(500)"`                           // API 地址
	APIKey              string    `json:"-" gorm:"type:varchar(1000)"`                                // API Key（加密存储，不返回给前端）
	Model               string    `json:"model" gorm:"type:varchar(100)"`                            // 模型名称
	CustomerCanUseKB    bool      `json:"customer_can_use_kb" gorm:"default:true"`                   // 是否开放知识库给客服使用（创建/上传/RAG）
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
