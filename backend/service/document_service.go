package service

import (
	"context"
	"errors"
	"log"
	"strconv"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/service/rag"
)

// DocumentService 文档管理服务
type DocumentService struct {
	docRepo                *repository.DocumentRepository
	kbRepo                 *repository.KnowledgeBaseRepository
	documentEmbeddingService *rag.DocumentEmbeddingService
	retrievalService       *rag.RetrievalService
}

// NewDocumentService 创建文档服务实例
func NewDocumentService(
	docRepo *repository.DocumentRepository,
	kbRepo *repository.KnowledgeBaseRepository,
	documentEmbeddingService *rag.DocumentEmbeddingService,
	retrievalService *rag.RetrievalService,
) *DocumentService {
	return &DocumentService{
		docRepo:                docRepo,
		kbRepo:                 kbRepo,
		documentEmbeddingService: documentEmbeddingService,
		retrievalService:       retrievalService,
	}
}

// CreateDocument 创建文档
func (s *DocumentService) CreateDocument(input CreateDocumentInput) (*DocumentSummary, error) {
	// 验证知识库是否存在
	_, err := s.kbRepo.GetByID(input.KnowledgeBaseID)
	if err != nil {
		return nil, errors.New("知识库不存在")
	}

	if input.Title == "" {
		return nil, errors.New("文档标题不能为空")
	}
	if input.Content == "" {
		return nil, errors.New("文档内容不能为空")
	}

	docType := input.Type
	if docType == "" {
		docType = "document"
	}

	status := input.Status
	if status == "" {
		status = "draft"
	}

	doc := &models.Document{
		KnowledgeBaseID: input.KnowledgeBaseID,
		Title:           input.Title,
		Content:         input.Content,
		Summary:         input.Summary,
		Type:            docType,
		Status:          status,
		EmbeddingStatus: "pending",
	}

	if err := s.docRepo.Create(doc); err != nil {
		return nil, err
	}

	// 新建文档后自动异步向量化，状态见文档列表的「向量状态」；日志关键字 [文档向量化]
	go s.embedDocumentAsync(context.Background(), doc.ID, doc.KnowledgeBaseID, doc.Content)

	return s.toSummary(doc), nil
}

// embedDocumentAsync 异步向量化文档（新建/更新文档后触发）
func (s *DocumentService) embedDocumentAsync(ctx context.Context, docID uint, kbID uint, content string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[文档向量化] panic doc_id=%d: %v", docID, r)
			_ = s.docRepo.UpdateEmbeddingStatus(docID, "failed")
		}
	}()

	log.Printf("[文档向量化] 开始 doc_id=%d kb_id=%d content_len=%d", docID, kbID, len([]rune(content)))
	if err := s.docRepo.UpdateEmbeddingStatus(docID, "processing"); err != nil {
		log.Printf("[文档向量化] doc_id=%d 更新 processing 失败: %v", docID, err)
		return
	}

	err := s.documentEmbeddingService.EmbedDocument(ctx, docID, kbID, content)
	if err != nil {
		log.Printf("[文档向量化] doc_id=%d 失败: %v", docID, err)
		_ = s.docRepo.UpdateEmbeddingStatus(docID, "failed")
		return
	}

	if err := s.docRepo.UpdateEmbeddingStatus(docID, "completed"); err != nil {
		log.Printf("[文档向量化] doc_id=%d 更新 completed 失败: %v", docID, err)
		return
	}
	log.Printf("[文档向量化] 完成 doc_id=%d", docID)
}

// GetDocument 获取文档详情
func (s *DocumentService) GetDocument(id uint) (*DocumentSummary, error) {
	doc, err := s.docRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	return s.toSummary(doc), nil
}

// ListDocuments 获取文档列表
func (s *DocumentService) ListDocuments(knowledgeBaseID uint, page, pageSize int, keyword string, status string) (*DocumentListResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	docs, total, err := s.docRepo.GetByKnowledgeBaseID(knowledgeBaseID, page, pageSize, keyword, status)
	if err != nil {
		return nil, err
	}

	summaries := make([]DocumentSummary, len(docs))
	for i, doc := range docs {
		summaries[i] = *s.toSummary(&doc)
	}

	totalPage := int((total + int64(pageSize) - 1) / int64(pageSize))

	return &DocumentListResult{
		Documents: summaries,
		Total:     total,
		Page:      page,
		PageSize:  pageSize,
		TotalPage: totalPage,
	}, nil
}

// UpdateDocument 更新文档
func (s *DocumentService) UpdateDocument(id uint, input UpdateDocumentInput) (*DocumentSummary, error) {
	doc, err := s.docRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	needReembed := false

	if input.Title != nil {
		doc.Title = *input.Title
	}
	if input.Content != nil {
		doc.Content = *input.Content
		needReembed = true // 内容变化需要重新向量化
	}
	if input.Summary != nil {
		doc.Summary = *input.Summary
	}
	if input.Type != nil {
		doc.Type = *input.Type
	}
	if input.Status != nil {
		doc.Status = *input.Status
	}

	if err := s.docRepo.Update(doc); err != nil {
		return nil, err
	}

	// 如果内容变化，重新向量化
	if needReembed {
		doc.EmbeddingStatus = "pending"
		s.docRepo.Update(doc)
		go s.embedDocumentAsync(context.Background(), doc.ID, doc.KnowledgeBaseID, doc.Content)
	}

	return s.toSummary(doc), nil
}

// DeleteDocument 删除文档
func (s *DocumentService) DeleteDocument(id uint) error {
	_, err := s.docRepo.GetByID(id)
	if err != nil {
		return err
	}

	// 删除向量
	if err := s.documentEmbeddingService.DeleteDocumentEmbedding(context.Background(), id); err != nil {
		// 记录错误但不阻止删除
	}

	// 删除文档
	return s.docRepo.Delete(id)
}

// UpdateDocumentStatus 更新文档状态
func (s *DocumentService) UpdateDocumentStatus(id uint, status string) error {
	return s.docRepo.UpdateStatus(id, status)
}

// PublishDocument 发布文档
func (s *DocumentService) PublishDocument(id uint) error {
	return s.UpdateDocumentStatus(id, "published")
}

// UnpublishDocument 取消发布文档
func (s *DocumentService) UnpublishDocument(id uint) error {
	return s.UpdateDocumentStatus(id, "draft")
}

// SearchDocuments 向量检索文档
func (s *DocumentService) SearchDocuments(query string, topK int, knowledgeBaseID *uint) ([]DocumentSummary, error) {
	results, err := s.retrievalService.Retrieve(context.Background(), query, topK, knowledgeBaseID)
	if err != nil {
		return nil, err
	}

	// 获取文档 ID
	docIDs := make([]uint, 0, len(results))
	for _, result := range results {
		// 将 document_id 字符串转换为 uint
		docID, err := strconv.ParseUint(result.DocumentID, 10, 64)
		if err == nil {
			docIDs = append(docIDs, uint(docID))
		}
	}

	// 查询文档详情
	if len(docIDs) > 0 {
		docs, err := s.docRepo.GetByIDs(docIDs)
		if err == nil {
			// 保持检索结果的顺序
			docMap := make(map[uint]*models.Document)
			for i := range docs {
				docMap[docs[i].ID] = &docs[i]
			}
			
			summaries := make([]DocumentSummary, 0, len(docIDs))
			for _, docID := range docIDs {
				if doc, ok := docMap[docID]; ok {
					summaries = append(summaries, *s.toSummary(doc))
				}
			}
			return summaries, nil
		}
	}

	return []DocumentSummary{}, nil
}

// toSummary 转换为摘要
func (s *DocumentService) toSummary(doc *models.Document) *DocumentSummary {
	return &DocumentSummary{
		ID:              doc.ID,
		KnowledgeBaseID: doc.KnowledgeBaseID,
		Title:           doc.Title,
		Content:         doc.Content,
		Summary:         doc.Summary,
		Type:            doc.Type,
		Status:          doc.Status,
		EmbeddingStatus: doc.EmbeddingStatus,
		CreatedAt:       doc.CreatedAt,
		UpdatedAt:       doc.UpdatedAt,
	}
}
