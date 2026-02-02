package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/service/rag"
)

// BatchEmbeddingResult 批量向量化结果
type BatchEmbeddingResult struct {
	FailedDocs []uint   `json:"failed_docs"`
	Errors     []string `json:"errors"`
}

// BatchEmbedDocuments 批量向量化文档
// 用于优化导入性能，将多个文档一次性向量化
func (s *ImportService) BatchEmbedDocuments(ctx context.Context, docIDs []uint) (*BatchEmbeddingResult, error) {
	if len(docIDs) == 0 {
		return &BatchEmbeddingResult{}, nil
	}
	log.Printf("[导入] 批量向量化开始 doc_ids=%v", docIDs)

	result := &BatchEmbeddingResult{
		FailedDocs: []uint{},
		Errors:     []string{},
	}

	// 获取文档
	docs, err := s.docRepo.GetByIDs(docIDs)
	if err != nil {
		return result, fmt.Errorf("获取文档失败: %w", err)
	}

	// 准备向量化数据
	documentIDs := make([]uint, 0, len(docs))
	knowledgeBaseIDs := make([]uint, 0, len(docs))
	contents := make([]string, 0, len(docs))
	docMap := make(map[uint]*models.Document)

	for _, doc := range docs {
		if doc.EmbeddingStatus == "completed" {
			continue // 跳过已向量化的文档
		}

		// 更新状态为处理中
		docCopy := doc
		docCopy.EmbeddingStatus = "processing"
		if err := s.docRepo.Update(&docCopy); err != nil {
			log.Printf("更新文档 %d 状态失败: %v", doc.ID, err)
		}

		documentIDs = append(documentIDs, doc.ID)
		knowledgeBaseIDs = append(knowledgeBaseIDs, doc.KnowledgeBaseID)
		contents = append(contents, doc.Content)
		docMap[doc.ID] = &docCopy
	}

	if len(documentIDs) == 0 {
		return result, nil
	}

	// 批量向量化
	// 使用独立的 context，避免 HTTP 请求超时导致向量化失败
	// 向量化可能需要较长时间（特别是 Milvus LoadCollection 操作）
	embedCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	err = s.batchEmbedDocumentsInternal(embedCtx, documentIDs, knowledgeBaseIDs, contents, docMap, result)
	if err != nil {
		log.Printf("[导入] 批量向量化失败: %v", err)
		return result, err
	}
	log.Printf("[导入] 批量向量化成功 %d 条文档", len(documentIDs))
	return result, err
}

// batchEmbedDocumentsInternal 内部批量向量化实现
func (s *ImportService) batchEmbedDocumentsInternal(
	ctx context.Context,
	documentIDs []uint,
	knowledgeBaseIDs []uint,
	contents []string,
	docMap map[uint]*models.Document,
	result *BatchEmbeddingResult,
) error {
	// 获取 documentEmbeddingService（通过类型断言）
	embeddingService, ok := s.documentEmbeddingService.(*rag.DocumentEmbeddingService)
	if !ok {
		return fmt.Errorf("documentEmbeddingService 类型错误")
	}

	// 批量向量化
	err := embeddingService.EmbedDocuments(ctx, documentIDs, knowledgeBaseIDs, contents)
	if err != nil {
		// 批量失败，标记所有文档为失败
		for _, docID := range documentIDs {
			if doc, ok := docMap[docID]; ok {
				doc.EmbeddingStatus = "failed"
				s.docRepo.Update(doc)
				result.FailedDocs = append(result.FailedDocs, docID)
				result.Errors = append(result.Errors, fmt.Sprintf("文档 %d: %v", docID, err))
			}
		}
		return fmt.Errorf("批量向量化失败: %w", err)
	}

	// 更新所有文档状态为已完成
	for _, docID := range documentIDs {
		if doc, ok := docMap[docID]; ok {
			doc.EmbeddingStatus = "completed"
			if err := s.docRepo.Update(doc); err != nil {
				log.Printf("更新文档 %d 状态失败: %v", docID, err)
				result.FailedDocs = append(result.FailedDocs, docID)
				result.Errors = append(result.Errors, fmt.Sprintf("文档 %d: 更新状态失败: %v", docID, err))
			}
		}
	}

	return nil
}
