package service

import (
	"errors"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"gorm.io/gorm"
)

// QuickReplyService 负责快捷回复模板管理领域的业务编排。
type QuickReplyService struct {
	repo *repository.QuickReplyRepository
}

// NewQuickReplyService 创建 QuickReplyService 实例。
func NewQuickReplyService(repo *repository.QuickReplyRepository) *QuickReplyService {
	return &QuickReplyService{repo: repo}
}

// CreateQuickReply 创建新的快捷回复模板。
func (s *QuickReplyService) CreateQuickReply(input CreateQuickReplyInput) (*QuickReplySummary, error) {
	// 验证必填字段
	if input.Content == "" {
		return nil, errors.New("模板内容不能为空")
	}

	// 设置默认标题
	title := input.Title
	if title == "" {
		// 如果没有标题，取内容前20个字符作为标题
		if len(input.Content) > 20 {
			title = input.Content[:20] + "..."
		} else {
			title = input.Content
		}
	}

	reply := &models.QuickReply{
		UserID:    input.UserID,
		Title:     title,
		Content:   input.Content,
		Category:  input.Category,
		SortOrder: input.SortOrder,
	}

	if err := s.repo.Create(reply); err != nil {
		return nil, err
	}

	return s.toSummary(reply), nil
}

// UpdateQuickReply 更新快捷回复模板。
func (s *QuickReplyService) UpdateQuickReply(id uint, input UpdateQuickReplyInput, userID *uint) (*QuickReplySummary, error) {
	reply, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("模板不存在")
		}
		return nil, err
	}

	// 权限检查：只能修改自己的模板或公共模板（管理员可以修改公共模板）
	if reply.UserID != nil && userID != nil && *reply.UserID != *userID {
		return nil, errors.New("无权修改此模板")
	}

	// 更新字段
	if input.Title != nil {
		reply.Title = *input.Title
	}
	if input.Content != nil {
		if *input.Content == "" {
			return nil, errors.New("模板内容不能为空")
		}
		reply.Content = *input.Content
	}
	if input.Category != nil {
		reply.Category = *input.Category
	}
	if input.SortOrder != nil {
		reply.SortOrder = *input.SortOrder
	}

	if err := s.repo.Update(reply); err != nil {
		return nil, err
	}

	return s.toSummary(reply), nil
}

// DeleteQuickReply 删除快捷回复模板。
func (s *QuickReplyService) DeleteQuickReply(id uint, userID *uint) error {
	reply, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("模板不存在")
		}
		return err
	}

	// 权限检查：只能删除自己的模板
	if reply.UserID != nil && userID != nil && *reply.UserID != *userID {
		return errors.New("无权删除此模板")
	}

	return s.repo.Delete(id)
}

// GetQuickReply 获取快捷回复模板详情。
func (s *QuickReplyService) GetQuickReply(id uint) (*QuickReplySummary, error) {
	reply, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("模板不存在")
		}
		return nil, err
	}

	return s.toSummary(reply), nil
}

// ListQuickReplies 获取快捷回复模板列表（个人+公共）。
func (s *QuickReplyService) ListQuickReplies(userID uint, category string) ([]QuickReplySummary, error) {
	var replies []models.QuickReply
	var err error

	if category != "" {
		replies, err = s.repo.ListByCategory(userID, category)
	} else {
		replies, err = s.repo.ListByUserIDAndPublic(userID)
	}

	if err != nil {
		return nil, err
	}

	summaries := make([]QuickReplySummary, 0, len(replies))
	for _, reply := range replies {
		summaries = append(summaries, *s.toSummary(&reply))
	}

	return summaries, nil
}

// RecordUsage 记录模板使用（增加使用次数）。
func (s *QuickReplyService) RecordUsage(id uint) error {
	return s.repo.IncrementUsageCount(id)
}

// GetCategories 获取所有分类。
func (s *QuickReplyService) GetCategories(userID uint) ([]string, error) {
	return s.repo.GetCategories(userID)
}

// toSummary 将模型转换为摘要。
func (s *QuickReplyService) toSummary(reply *models.QuickReply) *QuickReplySummary {
	var userID *uint
	if reply.UserID != nil {
		userID = reply.UserID
	}
	return &QuickReplySummary{
		ID:         reply.ID,
		UserID:     userID,
		Title:      reply.Title,
		Content:    reply.Content,
		Category:   reply.Category,
		SortOrder:  reply.SortOrder,
		UsageCount: reply.UsageCount,
		CreatedAt:  reply.CreatedAt,
		UpdatedAt:  reply.UpdatedAt,
	}
}
