package service

import (
	"errors"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
)

// KnowledgeBaseService 知识库管理服务
type KnowledgeBaseService struct {
	kbRepo *repository.KnowledgeBaseRepository
	docRepo *repository.DocumentRepository
}

// NewKnowledgeBaseService 创建知识库服务实例
func NewKnowledgeBaseService(kbRepo *repository.KnowledgeBaseRepository, docRepo *repository.DocumentRepository) *KnowledgeBaseService {
	return &KnowledgeBaseService{
		kbRepo: kbRepo,
		docRepo: docRepo,
	}
}

// CreateKnowledgeBase 创建知识库
func (s *KnowledgeBaseService) CreateKnowledgeBase(input CreateKnowledgeBaseInput) (*KnowledgeBaseSummary, error) {
	if input.Name == "" {
		return nil, errors.New("知识库名称不能为空")
	}

	kb := &models.KnowledgeBase{
		Name:        input.Name,
		Description: input.Description,
		DocumentCount: 0,
	}

	if err := s.kbRepo.Create(kb); err != nil {
		return nil, err
	}

	return s.toSummary(kb), nil
}

// GetKnowledgeBase 获取知识库详情
func (s *KnowledgeBaseService) GetKnowledgeBase(id uint) (*KnowledgeBaseSummary, error) {
	kb, err := s.kbRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 更新文档数量
	count, err := s.docRepo.CountByKnowledgeBaseID(id)
	if err == nil {
		kb.DocumentCount = int(count)
		s.kbRepo.UpdateDocumentCount(id, int(count))
	}

	return s.toSummary(kb), nil
}

// ListKnowledgeBases 获取知识库列表
func (s *KnowledgeBaseService) ListKnowledgeBases() ([]KnowledgeBaseSummary, error) {
	kbs, err := s.kbRepo.List()
	if err != nil {
		return nil, err
	}

	// 更新每个知识库的文档数量
	summaries := make([]KnowledgeBaseSummary, len(kbs))
	for i, kb := range kbs {
		count, _ := s.docRepo.CountByKnowledgeBaseID(kb.ID)
		kb.DocumentCount = int(count)
		summaries[i] = *s.toSummary(&kb)
	}

	return summaries, nil
}

// UpdateKnowledgeBase 更新知识库
func (s *KnowledgeBaseService) UpdateKnowledgeBase(id uint, input UpdateKnowledgeBaseInput) (*KnowledgeBaseSummary, error) {
	kb, err := s.kbRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if input.Name != nil {
		if *input.Name == "" {
			return nil, errors.New("知识库名称不能为空")
		}
		kb.Name = *input.Name
	}
	if input.Description != nil {
		kb.Description = *input.Description
	}
	if input.RAGEnabled != nil {
		kb.RAGEnabled = *input.RAGEnabled
	}

	if err := s.kbRepo.Update(kb); err != nil {
		return nil, err
	}

	return s.toSummary(kb), nil
}

// DeleteKnowledgeBase 删除知识库
func (s *KnowledgeBaseService) DeleteKnowledgeBase(id uint) error {
	// 检查是否有文档
	count, err := s.docRepo.CountByKnowledgeBaseID(id)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("知识库包含文档，无法删除")
	}

	return s.kbRepo.Delete(id)
}

// toSummary 转换为摘要
func (s *KnowledgeBaseService) toSummary(kb *models.KnowledgeBase) *KnowledgeBaseSummary {
	return &KnowledgeBaseSummary{
		ID:            kb.ID,
		Name:          kb.Name,
		Description:   kb.Description,
		DocumentCount: int64(kb.DocumentCount),
		RAGEnabled:    kb.RAGEnabled,
		CreatedAt:     kb.CreatedAt,
		UpdatedAt:     kb.UpdatedAt,
	}
}
