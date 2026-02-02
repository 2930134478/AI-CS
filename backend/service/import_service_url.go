package service

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/2930134478/AI-CS/backend/models"
	import_service "github.com/2930134478/AI-CS/backend/service/import"
)

// ImportFromUrls 从 URL 导入文档
func (s *ImportService) ImportFromUrls(ctx context.Context, knowledgeBaseID uint, urls []string) (*ImportResult, error) {
	log.Printf("[导入] URL 导入开始 knowledge_base_id=%d urls=%d", knowledgeBaseID, len(urls))
	// 验证知识库是否存在
	_, err := s.kbRepo.GetByID(knowledgeBaseID)
	if err != nil {
		return nil, errors.New("知识库不存在")
	}

	result := &ImportResult{
		SuccessCount: 0,
		FailedCount:  0,
		FailedFiles:  []string{},
		Errors:       []string{},
	}

	// 创建 URL 解析器
	urlParser := import_service.NewURLParser()

	// 解析 URL
	documents := make([]*models.Document, 0)
	for _, url := range urls {
		if !urlParser.Supports(url) {
			result.FailedCount++
			result.FailedFiles = append(result.FailedFiles, url)
			result.Errors = append(result.Errors, fmt.Sprintf("%s: 无效的 URL", url))
			continue
		}

		// 解析 URL
		parsed, err := urlParser.Parse(url)
		if err != nil {
			result.FailedCount++
			result.FailedFiles = append(result.FailedFiles, url)
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", url, err))
			continue
		}

		// 创建文档
		doc := &models.Document{
			KnowledgeBaseID: knowledgeBaseID,
			Title:           parsed.Title,
			Content:         parsed.Content,
			Type:            "url",
			Status:          "draft",
			EmbeddingStatus: "pending",
		}

		documents = append(documents, doc)
	}

	// 批量创建文档
	docIDs := make([]uint, 0, len(documents))
	for _, doc := range documents {
		if err := s.docRepo.Create(doc); err != nil {
			result.FailedCount++
			result.FailedFiles = append(result.FailedFiles, doc.Title)
			result.Errors = append(result.Errors, fmt.Sprintf("文档 %s: 创建失败: %v", doc.Title, err))
			continue
		}
		docIDs = append(docIDs, doc.ID)
		result.SuccessCount++
	}

	// 批量向量化（异步）
	if len(docIDs) > 0 {
		ids := make([]uint, len(docIDs))
		copy(ids, docIDs)
		go func(ids []uint) {
			log.Printf("[导入] URL 导入已创建 %d 条文档，开始批量向量化", len(ids))
			_, err := s.BatchEmbedDocuments(context.Background(), ids)
			if err != nil {
				log.Printf("[导入] 批量向量化失败: %v", err)
				return
			}
			log.Printf("[导入] 批量向量化完成，%d 条文档已写入向量库", len(ids))
		}(ids)
	}

	return result, nil
}
