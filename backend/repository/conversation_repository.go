package repository

import (
	"errors"
	"time"

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

// ListByTypeAndStatus 返回指定类型的会话列表（支持 open/closed/all）。
func (r *ConversationRepository) ListByTypeAndStatus(conversationType string, status string) ([]models.Conversation, error) {
	var conversations []models.Conversation
	q := r.db.Where("conversation_type = ?", conversationType)
	switch status {
	case "open":
		q = q.Where("status = ?", "open")
	case "closed":
		q = q.Where("status = ?", "closed")
	case "", "all":
		// no-op
	default:
		return nil, errors.New("invalid status")
	}
	if err := q.Order("updated_at desc").Find(&conversations).Error; err != nil {
		return nil, err
	}
	return conversations, nil
}

// ListInternalByAgentIDAndStatus 返回某客服的内部对话（支持 open/closed/all）。
func (r *ConversationRepository) ListInternalByAgentIDAndStatus(agentID uint, status string) ([]models.Conversation, error) {
	var conversations []models.Conversation
	q := r.db.Where("conversation_type = ? AND agent_id = ?", "internal", agentID)
	switch status {
	case "open":
		q = q.Where("status = ?", "open")
	case "closed":
		q = q.Where("status = ?", "closed")
	case "", "all":
		// no-op
	default:
		return nil, errors.New("invalid status")
	}
	if err := q.Order("updated_at desc").Find(&conversations).Error; err != nil {
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

// CloseStaleOpenVisitorConversations 关闭长期未更新的 open 访客会话。
func (r *ConversationRepository) CloseStaleOpenVisitorConversations(olderThan time.Time) (int64, error) {
	result := r.db.Model(&models.Conversation{}).
		Where("conversation_type = ? AND status = ? AND updated_at < ?", "visitor", "open", olderThan).
		Update("status", "closed")
	return result.RowsAffected, result.Error
}

// ListVisitorForAgentList 分页查询客服列表可见的访客会话（排除 AI 模式，且需有访客侧消息）。
func (r *ConversationRepository) ListVisitorForAgentList(status string, offset, limit int) ([]models.Conversation, int64, error) {
	q := r.db.Model(&models.Conversation{}).
		Where("conversation_type = ? AND chat_mode != ?", "visitor", "ai").
		Where("EXISTS (SELECT 1 FROM messages WHERE messages.conversation_id = conversations.id AND messages.sender_is_agent = ?)", false)

	switch status {
	case "open":
		q = q.Where("status = ?", "open")
	case "closed":
		q = q.Where("status = ?", "closed")
	case "", "all":
	default:
		return nil, 0, errors.New("invalid status")
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var conversations []models.Conversation
	if err := q.Order("updated_at desc").Offset(offset).Limit(limit).Find(&conversations).Error; err != nil {
		return nil, 0, err
	}
	return conversations, total, nil
}

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
