package rag

import (
	"context"
	"fmt"
	"log"

	"github.com/2930134478/AI-CS/backend/service/embedding"
)

// DocumentEmbeddingService 文档向量化服务
type DocumentEmbeddingService struct {
	vectorStoreService *VectorStoreService
	embeddingProvider  embedding.EmbeddingProvider
}

// NewDocumentEmbeddingService 创建文档向量化服务实例（使用 provider 实现配置保存即生效）
func NewDocumentEmbeddingService(vectorStoreService *VectorStoreService, embeddingProvider embedding.EmbeddingProvider) *DocumentEmbeddingService {
	return &DocumentEmbeddingService{
		vectorStoreService: vectorStoreService,
		embeddingProvider:  embeddingProvider,
	}
}

// EmbedDocument 向量化单个文档并存储
func (s *DocumentEmbeddingService) EmbedDocument(ctx context.Context, documentID uint, knowledgeBaseID uint, content string) error {
	svc, err := s.embeddingProvider.Get(ctx)
	if err != nil {
		return fmt.Errorf("获取嵌入服务失败: %w", err)
	}
	// 向量化
	vectors, err := svc.EmbedTexts(ctx, []string{content})
	if err != nil {
		return fmt.Errorf("文档向量化失败: %w", err)
	}
	if len(vectors) == 0 {
		return fmt.Errorf("未返回向量")
	}

	// 存储向量
	docIDStr := ConvertDocumentID(documentID)
	kbIDStr := ConvertKnowledgeBaseID(knowledgeBaseID)
	if err := s.vectorStoreService.UpsertVector(ctx, docIDStr, kbIDStr, content, vectors[0]); err != nil {
		return fmt.Errorf("存储向量失败: %w", err)
	}

	return nil
}

// EmbedDocuments 批量向量化文档并存储
func (s *DocumentEmbeddingService) EmbedDocuments(ctx context.Context, documentIDs []uint, knowledgeBaseIDs []uint, contents []string) error {
	if len(documentIDs) != len(knowledgeBaseIDs) || len(documentIDs) != len(contents) {
		return fmt.Errorf("参数长度不匹配")
	}
	svc, err := s.embeddingProvider.Get(ctx)
	if err != nil {
		return fmt.Errorf("获取嵌入服务失败: %w", err)
	}
	// 诊断日志：批量向量化前，我们传给 EmbedTexts 的文档/内容条数
	log.Printf("[嵌入] EmbedDocuments 调用前: len(documentIDs)=%d, len(contents)=%d（若 contents 已是多条，说明上游在发请求前做了分块）", len(documentIDs), len(contents))
	// 批量向量化
	vectors, err := svc.EmbedTexts(ctx, contents)
	if err != nil {
		return fmt.Errorf("批量向量化失败: %w", err)
	}
	log.Printf("[嵌入] EmbedDocuments 调用后: len(vectors)=%d, len(contents)=%d", len(vectors), len(contents))
	if len(vectors) != len(contents) {
		log.Printf("[嵌入] 向量数与内容数不一致，将报错: 我们按 %d 行写入 Milvus 会与 embedding 列 %d 行冲突", len(contents), len(vectors))
		return fmt.Errorf("向量数量不匹配")
	}

	// 转换 ID
	docIDStrs := make([]string, len(documentIDs))
	kbIDStrs := make([]string, len(knowledgeBaseIDs))
	for i, id := range documentIDs {
		docIDStrs[i] = ConvertDocumentID(id)
	}
	for i, id := range knowledgeBaseIDs {
		kbIDStrs[i] = ConvertKnowledgeBaseID(id)
	}

	// 批量存储向量
	if err := s.vectorStoreService.UpsertVectors(ctx, docIDStrs, kbIDStrs, contents, vectors); err != nil {
		return fmt.Errorf("批量存储向量失败: %w", err)
	}

	return nil
}

// DeleteDocumentEmbedding 删除文档的向量
func (s *DocumentEmbeddingService) DeleteDocumentEmbedding(ctx context.Context, documentID uint) error {
	docIDStr := ConvertDocumentID(documentID)
	return s.vectorStoreService.DeleteVector(ctx, docIDStr)
}

// DeleteDocumentEmbeddings 批量删除文档的向量
func (s *DocumentEmbeddingService) DeleteDocumentEmbeddings(ctx context.Context, documentIDs []uint) error {
	docIDStrs := make([]string, len(documentIDs))
	for i, id := range documentIDs {
		docIDStrs[i] = ConvertDocumentID(id)
	}
	return s.vectorStoreService.DeleteVectors(ctx, docIDStrs)
}
