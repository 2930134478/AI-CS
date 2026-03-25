package rag

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	"github.com/2930134478/AI-CS/backend/infra"
)

// ErrVectorStoreUnavailable 向量库未启用或未连接（写入/索引前会返回该错误）。
var ErrVectorStoreUnavailable = errors.New("向量数据库未启用或未连接")

// VectorStoreService 向量存储服务（业务层）
type VectorStoreService struct {
	vectorStore *infra.VectorStore
}

// NewVectorStoreService 创建向量存储服务实例（vectorStore 可为 nil，表示无向量库降级模式）。
func NewVectorStoreService(vectorStore *infra.VectorStore) *VectorStoreService {
	return &VectorStoreService{
		vectorStore: vectorStore,
	}
}

// IsAvailable 当前是否已连接可用的 Milvus 向量存储。
func (s *VectorStoreService) IsAvailable() bool {
	return s != nil && s.vectorStore != nil
}

// UpsertVector 插入或更新单个向量
func (s *VectorStoreService) UpsertVector(ctx context.Context, documentID string, knowledgeBaseID string, content string, vector []float32) error {
	if s.vectorStore == nil {
		return ErrVectorStoreUnavailable
	}
	return s.vectorStore.UpsertVector(ctx, documentID, knowledgeBaseID, content, vector)
}

// UpsertVectors 批量插入或更新向量
func (s *VectorStoreService) UpsertVectors(ctx context.Context, documentIDs []string, knowledgeBaseIDs []string, contents []string, vectors [][]float32) error {
	if s.vectorStore == nil {
		return ErrVectorStoreUnavailable
	}
	return s.vectorStore.UpsertVectors(ctx, documentIDs, knowledgeBaseIDs, contents, vectors)
}

// SearchVectors 搜索相似向量
func (s *VectorStoreService) SearchVectors(ctx context.Context, queryVector []float32, topK int, knowledgeBaseID *string) ([]SearchResult, error) {
	if s.vectorStore == nil {
		return []SearchResult{}, nil
	}
	results, err := s.vectorStore.SearchVectors(ctx, queryVector, topK, knowledgeBaseID)
	if err != nil {
		return nil, fmt.Errorf("向量检索失败: %w", err)
	}

	// 转换结果
	searchResults := make([]SearchResult, len(results))
	for i, r := range results {
		searchResults[i] = SearchResult{
			DocumentID:      r.DocumentID,
			KnowledgeBaseID: r.KnowledgeBaseID,
			Content:         r.Content,
			Score:           r.Score,
		}
	}

	return searchResults, nil
}

// DeleteVector 删除向量
func (s *VectorStoreService) DeleteVector(ctx context.Context, documentID string) error {
	if s.vectorStore == nil {
		return nil
	}
	return s.vectorStore.DeleteVector(ctx, documentID)
}

// DeleteVectors 批量删除向量
func (s *VectorStoreService) DeleteVectors(ctx context.Context, documentIDs []string) error {
	if s.vectorStore == nil {
		return nil
	}
	return s.vectorStore.DeleteVectors(ctx, documentIDs)
}

// ConvertDocumentID 将 uint 转换为 string
func ConvertDocumentID(id uint) string {
	return strconv.FormatUint(uint64(id), 10)
}

// ConvertKnowledgeBaseID 将 uint 转换为 string
func ConvertKnowledgeBaseID(id uint) string {
	return strconv.FormatUint(uint64(id), 10)
}
