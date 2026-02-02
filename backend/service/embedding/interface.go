package embedding

import (
	"context"
)

// EmbeddingProvider 按需提供嵌入服务（每次从 DB 配置读取，保存即生效）
type EmbeddingProvider interface {
	Get(ctx context.Context) (EmbeddingService, error)
}

// EmbeddingService 嵌入服务接口
type EmbeddingService interface {
	// EmbedText 向量化单个文本
	EmbedText(ctx context.Context, text string) ([]float32, error)
	// EmbedTexts 批量向量化文本
	EmbedTexts(ctx context.Context, texts []string) ([][]float32, error)
	// GetDimension 获取向量维度
	GetDimension() int
	// GetModelName 获取模型名称
	GetModelName() string
}
