package repository

import (
	"errors"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// MessageRepository 封装与消息相关的数据库操作。
type MessageRepository struct {
	db *gorm.DB
}

// NewMessageRepository 创建消息仓库实例。
func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// Create 新建一条消息记录。
func (r *MessageRepository) Create(message *models.Message) error {
	return r.db.Create(message).Error
}

// ListByConversationID 按时间顺序查询会话中的全部消息。
func (r *MessageRepository) ListByConversationID(conversationID uint) ([]models.Message, error) {
	var messages []models.Message
	if err := r.db.Where("conversation_id = ?", conversationID).Order("created_at asc").Find(&messages).Error; err != nil {
		return nil, err
	}
	return messages, nil
}

// LatestByConversationID 查询会话中最新的一条消息。
func (r *MessageRepository) LatestByConversationID(conversationID uint) (*models.Message, error) {
	var message models.Message
	if err := r.db.Where("conversation_id = ?", conversationID).
		Order("created_at desc").
		First(&message).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &message, nil
}

// CountUnreadBySender 统计指定发送方的未读消息数量。
func (r *MessageRepository) CountUnreadBySender(conversationID uint, senderIsAgent bool) (int64, error) {
	var count int64
	if err := r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_is_agent = ? AND is_read = ?", conversationID, senderIsAgent, false).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// FindConversationIDsByContent 根据关键字查询包含该内容的会话 ID。
func (r *MessageRepository) FindConversationIDsByContent(keyword string) ([]uint, error) {
	var ids []uint
	if err := r.db.Model(&models.Message{}).
		Where("content LIKE ?", keyword).
		Pluck("conversation_id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

// MarkMessagesRead 将指定发送方的未读消息标记为已读，并返回受影响的消息 ID 及时间。
func (r *MessageRepository) MarkMessagesRead(conversationID uint, senderIsAgent bool) ([]uint, int64, time.Time, error) {
	var messageIDs []uint
	if err := r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_is_agent = ? AND is_read = ?", conversationID, senderIsAgent, false).
		Pluck("id", &messageIDs).Error; err != nil {
		return nil, 0, time.Time{}, err
	}
	if len(messageIDs) == 0 {
		return []uint{}, 0, time.Time{}, nil
	}
	now := time.Now()
	if err := r.db.Model(&models.Message{}).
		Where("id IN ?", messageIDs).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error; err != nil {
		return nil, 0, time.Time{}, err
	}
	remaining, err := r.CountUnreadBySender(conversationID, senderIsAgent)
	if err != nil {
		return nil, 0, time.Time{}, nil
	}
	return messageIDs, remaining, now, nil
}

// HasAgentJoinMessage 检查该对话中是否已经存在该客服的加入消息。
// 用于避免重复创建"xxx加入了会话"的系统消息。
func (r *MessageRepository) HasAgentJoinMessage(conversationID uint, agentID uint, agentName string) (bool, error) {
	var count int64
	joinMessageContent := agentName + "加入了会话"
	if err := r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id = ? AND sender_is_agent = ? AND message_type = ? AND content = ?",
			conversationID, agentID, true, "system_message", joinMessageContent).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// HasVisitorMessageInHumanMode 检查对话中是否有访客在人工模式下发送的消息。
// 用于判断对话是否应该显示在客服列表中。
// 只有当 ChatMode == "human" 且存在访客发送的消息时，才应该显示。
func (r *MessageRepository) HasVisitorMessageInHumanMode(conversationID uint) (bool, error) {
	var count int64
	// 查询是否有访客发送的消息（sender_is_agent = false）
	// 注意：这里不检查 ChatMode，因为 ChatMode 在 Conversation 表中
	// 这个方法只检查消息是否存在，ChatMode 的检查在 Service 层
	if err := r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_is_agent = ?", conversationID, false).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// HasAgentParticipated 检查指定客服是否在指定会话中发送过消息。
// 用于判断该会话是否应该出现在该客服的"My chats"列表中。
func (r *MessageRepository) HasAgentParticipated(conversationID uint, agentID uint) (bool, error) {
	var count int64
	// 查询是否有该客服发送的消息（sender_is_agent = true AND sender_id = agentID）
	// 注意：系统消息（message_type = 'system_message'）也应该算作参与
	// 所以不限制 message_type，包括所有类型的消息
	if err := r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_is_agent = ? AND sender_id = ?", conversationID, true, agentID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
