package service

import (
	"errors"
	"log"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"gorm.io/gorm"
)

// ErrConversationClosed indicates operations are attempted on a closed conversation.
var (
	// ErrConversationClosed 表示会话已关闭，不能继续发送消息。
	ErrConversationClosed = errors.New("conversation is closed")
	// ErrConversationNotFound 表示未找到指定的会话记录。
	ErrConversationNotFound = gorm.ErrRecordNotFound
)

// MessageService 负责消息领域的业务处理。
type MessageService struct {
	conversations *repository.ConversationRepository
	messages      *repository.MessageRepository
	hub           BroadcastHub
}

// NewMessageService 创建 MessageService 实例。
func NewMessageService(
	conversations *repository.ConversationRepository,
	messages *repository.MessageRepository,
	hub BroadcastHub,
) *MessageService {
	return &MessageService{
		conversations: conversations,
		messages:      messages,
		hub:           hub,
	}
}

// CreateMessage 创建消息并通过 WebSocket 广播。
func (s *MessageService) CreateMessage(input CreateMessageInput) (*models.Message, error) {
	conv, err := s.conversations.GetByID(input.ConversationID)
	if err != nil {
		return nil, err
	}

	if conv.Status == "closed" {
		return nil, ErrConversationClosed
	}

	if input.SenderIsAgent && input.SenderID == 0 {
		return nil, errors.New("sender_id is required for agent messages")
	}

	message := &models.Message{
		ConversationID: input.ConversationID,
		SenderID:       input.SenderID,
		SenderIsAgent:  input.SenderIsAgent,
		Content:        input.Content,
		MessageType:    "user_message",
		IsRead:         false,
	}

	if err := s.messages.Create(message); err != nil {
		return nil, err
	}

	if err := s.conversations.UpdateFields(conv.ID, map[string]interface{}{
		"updated_at": message.CreatedAt,
	}); err != nil {
		return nil, err
	}

	if s.hub != nil {
		s.hub.BroadcastMessage(message.ConversationID, "new_message", message)
	} else {
		log.Printf("⚠️ WebSocket Hub 为空，无法广播消息: 消息ID=%d, 对话ID=%d", message.ID, message.ConversationID)
	}

	return message, nil
}

// ListMessages 返回会话内的全部消息。
func (s *MessageService) ListMessages(conversationID uint) ([]models.Message, error) {
	return s.messages.ListByConversationID(conversationID)
}

// MarkMessagesRead 将消息标记为已读并通知监听方。
func (s *MessageService) MarkMessagesRead(conversationID uint, readerIsAgent bool) (*MarkMessagesReadResult, error) {
	messageIDs, unreadRemaining, readAt, err := s.messages.MarkMessagesRead(conversationID, !readerIsAgent)
	if err != nil {
		return nil, err
	}

	result := &MarkMessagesReadResult{
		ConversationID: conversationID,
		MessageIDs:     messageIDs,
		UnreadCount:    unreadRemaining,
		ReadAt:         readAt,
	}

	if s.hub != nil && len(messageIDs) > 0 {
		s.hub.BroadcastMessage(conversationID, "messages_read", map[string]interface{}{
			"message_ids":     messageIDs,
			"reader_is_agent": readerIsAgent,
			"read_at":         readAt,
			"unread_count":    unreadRemaining,
			"conversation_id": conversationID, // 确保 payload 中也包含 conversation_id
		})
	}

	return result, nil
}
