package service

import (
	"errors"
	"strings"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"gorm.io/gorm"
)

// FAQService 负责 FAQ（常见问题）管理领域的业务编排。
type FAQService struct {
	faqs *repository.FAQRepository
}

// NewFAQService 创建 FAQService 实例。
func NewFAQService(faqs *repository.FAQRepository) *FAQService {
	return &FAQService{faqs: faqs}
}

// CreateFAQ 创建新的 FAQ 记录。
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
		Question: input.Question,
		Answer:   input.Answer,
		Keywords: input.Keywords,
	}

	if err := s.faqs.Create(faq); err != nil {
		return nil, err
	}

	return s.toSummary(faq), nil
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
// query 格式：关键词之间用 % 分隔，例如 "openai%api%调用"
// 搜索逻辑：所有关键词都要包含（AND 查询）
func (s *FAQService) ListFAQs(query string) ([]FAQSummary, error) {
	// 解析关键词
	keywords := s.parseKeywords(query)

	// 查询 FAQ 列表
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

// UpdateFAQ 更新 FAQ 记录。
func (s *FAQService) UpdateFAQ(id uint, input UpdateFAQInput) (*FAQSummary, error) {
	// 获取现有记录
	faq, err := s.faqs.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("FAQ 不存在")
		}
		return nil, err
	}

	// 验证必填字段
	if input.Question != nil && *input.Question == "" {
		return nil, errors.New("问题不能为空")
	}
	if input.Answer != nil && *input.Answer == "" {
		return nil, errors.New("答案不能为空")
	}

	// 更新字段
	if input.Question != nil {
		faq.Question = *input.Question
	}
	if input.Answer != nil {
		faq.Answer = *input.Answer
	}
	if input.Keywords != nil {
		faq.Keywords = *input.Keywords
	}

	// 保存更新
	if err := s.faqs.Update(faq); err != nil {
		return nil, err
	}

	return s.toSummary(faq), nil
}

// DeleteFAQ 删除 FAQ 记录。
func (s *FAQService) DeleteFAQ(id uint) error {
	// 检查记录是否存在
	_, err := s.faqs.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("FAQ 不存在")
		}
		return err
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

