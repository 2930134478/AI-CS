package repository

import (
	"errors"

	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// ConversationRepository 封装与会话相关的数据库操作。
type ConversationRepository struct {
	db *gorm.DB
}

// NewConversationRepository 创建会话仓库实例。
func NewConversationRepository(db *gorm.DB) *ConversationRepository {
	return &ConversationRepository{db: db}
}

// FindOpenByVisitorID 查询访客当前未关闭的会话（仅 visitor 类型）。
func (r *ConversationRepository) FindOpenByVisitorID(visitorID uint) (*models.Conversation, error) {
	var conv models.Conversation
	err := r.db.Where("conversation_type = ? AND visitor_id = ? AND status != ?", "visitor", visitorID, "closed").
		Order("created_at desc").
		First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// ListActiveInternalByAgentID 返回某客服的全部未关闭内部对话（知识库测试用）。
func (r *ConversationRepository) ListActiveInternalByAgentID(agentID uint) ([]models.Conversation, error) {
	var list []models.Conversation
	err := r.db.Where("conversation_type = ? AND agent_id = ? AND status != ?", "internal", agentID, "closed").
		Order("updated_at desc").
		Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

// Create 创建新的会话记录。
func (r *ConversationRepository) Create(conv *models.Conversation) error {
	return r.db.Create(conv).Error
}

// UpdateFields 更新会话的指定字段。
func (r *ConversationRepository) UpdateFields(id uint, values map[string]interface{}) error {
	if len(values) == 0 {
		return nil
	}
	return r.db.Model(&models.Conversation{}).Where("id = ?", id).Updates(values).Error
}

// GetByID 根据主键查询会话。
func (r *ConversationRepository) GetByID(id uint) (*models.Conversation, error) {
	var conv models.Conversation
	if err := r.db.First(&conv, id).Error; err != nil {
		return nil, err
	}
	return &conv, nil
}

// ListActive 返回所有未关闭的访客会话（不含 internal）。
func (r *ConversationRepository) ListActive() ([]models.Conversation, error) {
	var conversations []models.Conversation
	if err := r.db.Where("conversation_type = ? AND status != ?", "visitor", "closed").
		Order("updated_at desc").
		Find(&conversations).Error; err != nil {
		return nil, err
	}
	return conversations, nil
}

// ListByIDs 根据多个 ID 批量查询会话。
func (r *ConversationRepository) ListByIDs(ids []uint) ([]models.Conversation, error) {
	if len(ids) == 0 {
		return []models.Conversation{}, nil
	}
	var conversations []models.Conversation
	if err := r.db.Where("id IN ? AND status != ?", ids, "closed").
		Order("updated_at desc").
		Find(&conversations).Error; err != nil {
		return nil, err
	}
	return conversations, nil
}

// SearchByIDOrVisitorLike 根据会话 ID 或访客 ID 进行模糊搜索。
func (r *ConversationRepository) SearchByIDOrVisitorLike(pattern string) ([]models.Conversation, error) {
	var conversations []models.Conversation
	if err := r.db.Where("CAST(id AS CHAR) LIKE ? OR CAST(visitor_id AS CHAR) LIKE ?", pattern, pattern).
		Find(&conversations).Error; err != nil {
		return nil, err
	}
	return conversations, nil
}

// AssignAgent 为会话分配客服。
func (r *ConversationRepository) AssignAgent(conversationID uint, agentID uint) error {
	result := r.db.Model(&models.Conversation{}).
		Where("id = ?", conversationID).
		Updates(map[string]interface{}{
			"agent_id": agentID,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// UpdateStatus 更新会话状态。
func (r *ConversationRepository) UpdateStatus(conversationID uint, status string) error {
	if status == "" {
		return errors.New("status cannot be empty")
	}
	return r.db.Model(&models.Conversation{}).
		Where("id = ?", conversationID).
		Update("status", status).Error
}
