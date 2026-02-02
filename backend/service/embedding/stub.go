package embedding

import (
	"context"
	"errors"
)

// ErrEmbeddingNotConfigured 嵌入服务未配置时返回的错误
var ErrEmbeddingNotConfigured = errors.New("知识库向量模型未配置，请先在「设置 - 知识库向量模型」中配置 API 后再使用")

// UnconfiguredEmbeddingService 未配置时的占位嵌入服务，实现 EmbeddingService 接口
// 用于 DB 与 .env 均无有效配置时仍能启动服务；实际调用向量化时会返回 ErrEmbeddingNotConfigured
type UnconfiguredEmbeddingService struct{}

// NewUnconfiguredEmbeddingService 创建未配置占位嵌入服务
func NewUnconfiguredEmbeddingService() *UnconfiguredEmbeddingService {
	return &UnconfiguredEmbeddingService{}
}

// EmbedText 向量化单个文本（未配置时返回错误）
func (s *UnconfiguredEmbeddingService) EmbedText(ctx context.Context, text string) ([]float32, error) {
	return nil, ErrEmbeddingNotConfigured
}

// EmbedTexts 批量向量化文本（未配置时返回错误）
func (s *UnconfiguredEmbeddingService) EmbedTexts(ctx context.Context, texts []string) ([][]float32, error) {
	return nil, ErrEmbeddingNotConfigured
}

// GetDimension 返回默认维度，用于创建向量存储（与常见 OpenAI 小模型一致）
func (s *UnconfiguredEmbeddingService) GetDimension() int {
	return 1536
}

// GetModelName 返回占位名称
func (s *UnconfiguredEmbeddingService) GetModelName() string {
	return "未配置"
}
