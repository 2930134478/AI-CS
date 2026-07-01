package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
)

// BatchLatestByConversationIDs 批量查询各会话最新一条消息。
func (r *MessageRepository) BatchLatestByConversationIDs(conversationIDs []uint) (map[uint]*models.Message, error) {
	result := make(map[uint]*models.Message, len(conversationIDs))
	if len(conversationIDs) == 0 {
		return result, nil
	}

	var latestIDs []uint
	if err := r.db.Model(&models.Message{}).
		Select("MAX(id)").
		Where("conversation_id IN ?", conversationIDs).
		Group("conversation_id").
		Pluck("MAX(id)", &latestIDs).Error; err != nil {
		return nil, err
	}
	if len(latestIDs) == 0 {
		return result, nil
	}

	var messages []models.Message
	if err := r.db.Where("id IN ?", latestIDs).Find(&messages).Error; err != nil {
		return nil, err
	}
	for i := range messages {
		msg := messages[i]
		result[msg.ConversationID] = &msg
	}
	return result, nil
}

type unreadCountRow struct {
	ConversationID uint
	Count          int64
}

// BatchCountUnreadBySender 批量统计各会话指定发送方未读数。
func (r *MessageRepository) BatchCountUnreadBySender(conversationIDs []uint, senderIsAgent bool) (map[uint]int64, error) {
	result := make(map[uint]int64, len(conversationIDs))
	if len(conversationIDs) == 0 {
		return result, nil
	}

	var rows []unreadCountRow
	if err := r.db.Model(&models.Message{}).
		Select("conversation_id, COUNT(*) as count").
		Where("conversation_id IN ? AND sender_is_agent = ? AND is_read = ?", conversationIDs, senderIsAgent, false).
		Group("conversation_id").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.ConversationID] = row.Count
	}
	return result, nil
}

// BatchHasAgentParticipated 批量检查客服是否参与过各会话。
func (r *MessageRepository) BatchHasAgentParticipated(conversationIDs []uint, agentID uint) (map[uint]bool, error) {
	result := make(map[uint]bool, len(conversationIDs))
	if len(conversationIDs) == 0 || agentID == 0 {
		return result, nil
	}

	var ids []uint
	if err := r.db.Model(&models.Message{}).
		Distinct("conversation_id").
		Where("conversation_id IN ? AND sender_is_agent = ? AND sender_id = ?", conversationIDs, true, agentID).
		Pluck("conversation_id", &ids).Error; err != nil {
		return nil, err
	}
	for _, id := range ids {
		result[id] = true
	}
	return result, nil
}

// CountTotalUnreadVisitorForAgentList 统计访客 open 人工列表中的访客未读总数（用于角标）。
func (r *MessageRepository) CountTotalUnreadVisitorForAgentList(status string) (int64, error) {
	var count int64
	q := r.db.Model(&models.Message{}).
		Joins("INNER JOIN conversations ON conversations.id = messages.conversation_id").
		Where("conversations.conversation_type = ? AND conversations.chat_mode != ?", "visitor", "ai").
		Where("messages.sender_is_agent = ? AND messages.is_read = ?", false, false).
		Where("EXISTS (SELECT 1 FROM messages m2 WHERE m2.conversation_id = conversations.id AND m2.sender_is_agent = ?)", false)
	if status == "open" {
		q = q.Where("conversations.status = ?", "open")
	} else if status == "closed" {
		q = q.Where("conversations.status = ?", "closed")
	}
	if err := q.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
