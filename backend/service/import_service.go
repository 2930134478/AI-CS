package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"path/filepath"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	import_service "github.com/2930134478/AI-CS/backend/service/import"
)

// ImportService 导入服务
type ImportService struct {
	docRepo                *repository.DocumentRepository
	kbRepo                 *repository.KnowledgeBaseRepository
	documentService        *DocumentService
	documentEmbeddingService interface{} // 使用 interface{} 避免循环依赖
	parsers                []import_service.DocumentParser
}

// NewImportService 创建导入服务实例
func NewImportService(
	docRepo *repository.DocumentRepository,
	kbRepo *repository.KnowledgeBaseRepository,
	documentService *DocumentService,
	documentEmbeddingService interface{},
) *ImportService {
	// 初始化解析器
	parsers := []import_service.DocumentParser{
		import_service.NewMarkdownParser(),
		import_service.NewPDFParser(),
		import_service.NewWordParser(),
	}

	return &ImportService{
		docRepo:                docRepo,
		kbRepo:                 kbRepo,
		documentService:        documentService,
		documentEmbeddingService: documentEmbeddingService,
		parsers:                parsers,
	}
}

// ImportFiles 导入文件
func (s *ImportService) ImportFiles(ctx context.Context, knowledgeBaseID uint, filePaths []string) (*ImportResult, error) {
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

	// 解析文件
	documents := make([]*models.Document, 0)
	for _, filePath := range filePaths {
		// 查找合适的解析器
		var parser import_service.DocumentParser
		for _, p := range s.parsers {
			if p.Supports(filePath) {
				parser = p
				break
			}
		}

		if parser == nil {
			result.FailedCount++
			result.FailedFiles = append(result.FailedFiles, filepath.Base(filePath))
			result.Errors = append(result.Errors, fmt.Sprintf("文件 %s: 不支持的文件格式", filepath.Base(filePath)))
			continue
		}

		// 解析文件
		parsed, err := parser.Parse(filePath)
		if err != nil {
			result.FailedCount++
			result.FailedFiles = append(result.FailedFiles, filepath.Base(filePath))
			result.Errors = append(result.Errors, fmt.Sprintf("文件 %s: %v", filepath.Base(filePath), err))
			continue
		}

		// 创建文档
		doc := &models.Document{
			KnowledgeBaseID: knowledgeBaseID,
			Title:           parsed.Title,
			Content:         parsed.Content,
			Type:            "document",
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
			log.Printf("[导入] 文件导入已创建 %d 条文档，开始批量向量化", len(ids))
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

// ImportResult 导入结果
type ImportResult struct {
	SuccessCount int      `json:"success_count"`
	FailedCount  int      `json:"failed_count"`
	FailedFiles  []string `json:"failed_files"`
	Errors       []string `json:"errors"`
	Message      string   `json:"message"`
}
