package rag

import (
	"context"

	"github.com/2930134478/AI-CS/backend/service/embedding"
)

// HealthChecker 健康检查器
type HealthChecker struct {
	embeddingProvider  embedding.EmbeddingProvider
	vectorStoreService *VectorStoreService
}

// NewHealthChecker 创建健康检查器实例（使用 provider 实现配置保存即生效）
func NewHealthChecker(embeddingProvider embedding.EmbeddingProvider, vectorStoreService *VectorStoreService) *HealthChecker {
	return &HealthChecker{
		embeddingProvider:  embeddingProvider,
		vectorStoreService: vectorStoreService,
	}
}

// Check 执行健康检查
func (h *HealthChecker) Check(ctx context.Context) error {
	svc, err := h.embeddingProvider.Get(ctx)
	if err != nil {
		return err
	}
	// 检查嵌入服务（简单测试）
	testText := "health check"
	_, err = svc.EmbedText(ctx, testText)
	if err != nil {
		return err
	}

	// 检查向量存储服务（简单搜索测试）
	testVector := make([]float32, svc.GetDimension())
	for i := range testVector {
		testVector[i] = 0.1
	}
	_, err = h.vectorStoreService.SearchVectors(ctx, testVector, 1, nil)
	if err != nil {
		return err
	}

	return nil
}
