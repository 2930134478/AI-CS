package service

import (
	"context"
	"errors"
	"log"
	"strconv"
	"strings"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/service/rag"
	"gorm.io/gorm"
)

// FAQService 负责 FAQ（常见问题）管理领域的业务编排。
type FAQService struct {
	faqs                    *repository.FAQRepository
	retrievalService        *rag.RetrievalService
	documentEmbeddingService *rag.DocumentEmbeddingService
}

// NewFAQService 创建 FAQService 实例。
func NewFAQService(
	faqs *repository.FAQRepository,
	retrievalService *rag.RetrievalService,
	documentEmbeddingService *rag.DocumentEmbeddingService,
) *FAQService {
	return &FAQService{
		faqs:                    faqs,
		retrievalService:        retrievalService,
		documentEmbeddingService: documentEmbeddingService,
	}
}

// CreateFAQ 创建新的 FAQ 记录。
// 创建后会自动进行向量化（异步处理）
func (s *FAQService) CreateFAQ(input CreateFAQInput) (*FAQSummary, error) {
	// 验证必填字段
	if input.Question == "" {
		return nil, errors.New("问题不能为空")
	}
	if input.Answer == "" {
		return nil, errors.New("答案不能为空")
	}

	// 创建 FAQ 记录
	faq := &models.FAQ{
		Question:        input.Question,
		Answer:          input.Answer,
		Keywords:        input.Keywords,
		EmbeddingStatus: "pending", // 初始状态为待处理
	}

	if err := s.faqs.Create(faq); err != nil {
		return nil, err
	}

	// 异步进行向量化（避免阻塞）
	go s.embedFAQAsync(context.Background(), faq.ID, faq)

	return s.toSummary(faq), nil
}

// embedFAQAsync 异步进行 FAQ 向量化
func (s *FAQService) embedFAQAsync(ctx context.Context, faqID uint, faq *models.FAQ) {
	// 更新状态为处理中
	faq.EmbeddingStatus = "processing"
	if err := s.faqs.Update(faq); err != nil {
		log.Printf("更新 FAQ %d 向量化状态失败: %v", faqID, err)
		return
	}

	// 构建向量化的内容（使用 Question + Answer）
	content := faq.Question + "\n" + faq.Answer

	// 获取知识库 ID（如果为空，使用默认值 0）
	kbID := uint(0)
	if faq.KnowledgeBaseID != nil {
		kbID = *faq.KnowledgeBaseID
	}

	// 进行向量化
	err := s.documentEmbeddingService.EmbedDocument(ctx, faqID, kbID, content)
	if err != nil {
		log.Printf("FAQ %d 向量化失败: %v", faqID, err)
		// 更新状态为失败
		faq.EmbeddingStatus = "failed"
		if updateErr := s.faqs.Update(faq); updateErr != nil {
			log.Printf("更新 FAQ %d 向量化状态失败: %v", faqID, updateErr)
		}
		return
	}

	// 更新状态为已完成，并保存向量 ID
	vectorID := strconv.FormatUint(uint64(faqID), 10)
	faq.VectorID = &vectorID
	faq.EmbeddingStatus = "completed"
	if err := s.faqs.Update(faq); err != nil {
		log.Printf("更新 FAQ %d 向量化状态失败: %v", faqID, err)
	}
}

// GetFAQ 获取 FAQ 详情。
func (s *FAQService) GetFAQ(id uint) (*FAQSummary, error) {
	faq, err := s.faqs.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("FAQ 不存在")
		}
		return nil, err
	}

	return s.toSummary(faq), nil
}

// ListFAQs 获取 FAQ 列表，支持关键词搜索。
// query: 查询字符串
// 搜索策略：优先使用向量检索，如果失败或查询为空，则使用关键词搜索
func (s *FAQService) ListFAQs(query string) ([]FAQSummary, error) {
	// 如果查询为空，直接返回所有 FAQ（按关键词搜索的空查询）
	if query == "" {
		faqs, err := s.faqs.List(nil)
		if err != nil {
			return nil, err
		}

		summaries := make([]FAQSummary, 0, len(faqs))
		for _, faq := range faqs {
			summaries = append(summaries, *s.toSummary(&faq))
		}
		return summaries, nil
	}

	// 优先使用向量检索
	results, err := s.SearchByVector(context.Background(), query, 10, "")
	if err == nil && len(results) > 0 {
		// 向量检索成功，转换为 FAQSummary
		summaries := make([]FAQSummary, 0, len(results))
		for _, result := range results {
			// 从结果中提取 FAQ ID
			faqID, parseErr := strconv.ParseUint(result.DocumentID, 10, 32)
			if parseErr != nil {
				continue
			}

			// 获取完整的 FAQ 信息
			faq, getErr := s.faqs.GetByID(uint(faqID))
			if getErr != nil {
				continue
			}

			summaries = append(summaries, *s.toSummary(faq))
		}
		return summaries, nil
	}

	// 向量检索失败，回退到关键词搜索
	log.Printf("向量检索失败，使用关键词搜索: %v", err)
	keywords := s.parseKeywords(query)
	faqs, err := s.faqs.List(keywords)
	if err != nil {
		return nil, err
	}

	// 转换为 Summary
	summaries := make([]FAQSummary, 0, len(faqs))
	for _, faq := range faqs {
		summaries = append(summaries, *s.toSummary(&faq))
	}

	return summaries, nil
}

// SearchByVector 使用向量检索搜索 FAQ
// query: 查询文本
// topK: 返回前 K 个结果
// knowledgeBaseID: 知识库 ID（可选，为空字符串则不过滤）
func (s *FAQService) SearchByVector(ctx context.Context, query string, topK int, knowledgeBaseID string) ([]rag.SearchResult, error) {
	if s.retrievalService == nil {
		return nil, errors.New("检索服务未初始化")
	}

	var kbID *uint
	if knowledgeBaseID != "" {
		if id, err := strconv.ParseUint(knowledgeBaseID, 10, 64); err == nil {
			u := uint(id)
			kbID = &u
		}
	}
	return s.retrievalService.Retrieve(ctx, query, topK, kbID)
}

// UpdateFAQ 更新 FAQ 记录。
// 如果 Question 或 Answer 发生变化，会同步更新向量
func (s *FAQService) UpdateFAQ(id uint, input UpdateFAQInput) (*FAQSummary, error) {
	// 获取现有记录
	faq, err := s.faqs.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("FAQ 不存在")
		}
		return nil, err
	}

	// 记录是否有内容变化（需要重新向量化）
	needReembed := false

	// 验证必填字段
	if input.Question != nil && *input.Question == "" {
		return nil, errors.New("问题不能为空")
	}
	if input.Answer != nil && *input.Answer == "" {
		return nil, errors.New("答案不能为空")
	}

	// 更新字段
	if input.Question != nil {
		if faq.Question != *input.Question {
			needReembed = true
			faq.Question = *input.Question
		}
	}
	if input.Answer != nil {
		if faq.Answer != *input.Answer {
			needReembed = true
			faq.Answer = *input.Answer
		}
	}
	if input.Keywords != nil {
		faq.Keywords = *input.Keywords
	}

	// 保存更新
	if err := s.faqs.Update(faq); err != nil {
		return nil, err
	}

	// 如果内容发生变化，需要重新向量化
	if needReembed {
		// 先删除旧的向量
		if faq.VectorID != nil {
			ctx := context.Background()
			if deleteErr := s.documentEmbeddingService.DeleteDocumentEmbedding(ctx, id); deleteErr != nil {
				log.Printf("删除 FAQ %d 旧向量失败: %v", id, deleteErr)
			}
		}

		// 异步重新向量化
		go s.embedFAQAsync(context.Background(), id, faq)
	}

	return s.toSummary(faq), nil
}

// DeleteFAQ 删除 FAQ 记录。
// 删除时也会删除对应的向量
func (s *FAQService) DeleteFAQ(id uint) error {
	// 检查记录是否存在
	faq, err := s.faqs.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("FAQ 不存在")
		}
		return err
	}

	// 删除向量（如果存在）
	if faq.VectorID != nil {
		ctx := context.Background()
		if deleteErr := s.documentEmbeddingService.DeleteDocumentEmbedding(ctx, id); deleteErr != nil {
			log.Printf("删除 FAQ %d 向量失败: %v", id, deleteErr)
			// 不中断删除流程，记录日志即可
		}
	}

	// 删除记录
	return s.faqs.Delete(id)
}

// parseKeywords 解析关键词查询字符串。
// 输入格式：关键词之间用 % 分隔，例如 "openai%api%调用"
// 返回：关键词数组
func (s *FAQService) parseKeywords(query string) []string {
	if query == "" {
		return nil
	}

	// 按 % 分隔
	parts := strings.Split(query, "%")
	keywords := make([]string, 0, len(parts))

	for _, part := range parts {
		// 去除首尾空格
		keyword := strings.TrimSpace(part)
		if keyword != "" {
			keywords = append(keywords, keyword)
		}
	}

	return keywords
}

// toSummary 将 FAQ 模型转换为 Summary。
func (s *FAQService) toSummary(faq *models.FAQ) *FAQSummary {
	return &FAQSummary{
		ID:        faq.ID,
		Question:  faq.Question,
		Answer:    faq.Answer,
		Keywords:  faq.Keywords,
		CreatedAt: faq.CreatedAt,
		UpdatedAt: faq.UpdatedAt,
	}
}
