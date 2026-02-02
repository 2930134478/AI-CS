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
	aiService     *AIService // AI 服务（用于 AI 自动回复）
}

// NewMessageService 创建 MessageService 实例。
func NewMessageService(
	conversations *repository.ConversationRepository,
	messages *repository.MessageRepository,
	hub BroadcastHub,
	aiService *AIService,
) *MessageService {
	return &MessageService{
		conversations: conversations,
		messages:      messages,
		hub:           hub,
		aiService:     aiService,
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
		ChatMode:       conv.ChatMode, // 记录消息发送时的对话模式
		IsRead:         false,
		// 文件相关字段（可选）
		FileURL:  input.FileURL,
		FileType: input.FileType,
		FileName: input.FileName,
		FileSize: input.FileSize,
		MimeType: input.MimeType,
	}

	if err := s.messages.Create(message); err != nil {
		return nil, err
	}

	// 如果客服发送消息，且会话的 agent_id 为 0，则更新为当前客服的 ID
	updateFields := map[string]interface{}{
		"updated_at": message.CreatedAt,
	}
	if input.SenderIsAgent && input.SenderID > 0 && conv.AgentID == 0 {
		updateFields["agent_id"] = input.SenderID
	}

	if err := s.conversations.UpdateFields(conv.ID, updateFields); err != nil {
		return nil, err
	}

	if s.hub != nil {
		// 1. 先广播到该对话的所有客户端（访客和已连接该对话的客服）
		s.hub.BroadcastMessage(message.ConversationID, "new_message", message)
		// 2. 如果是访客发送的消息，且对话模式是人工客服，才广播到所有客服
		//    这样即使客服没有连接到这个对话，也能收到新消息的通知
		//    注意：AI 模式下的访客消息不广播给客服（避免干扰）
		if !input.SenderIsAgent && conv.ChatMode == "human" {
			s.hub.BroadcastToAllAgents("new_message", message)
		}
	} else {
		log.Printf("⚠️ WebSocket Hub 为空，无法广播消息: 消息ID=%d, 对话ID=%d", message.ID, message.ConversationID)
	}

	// 3. 触发 AI 回复的两种情况：
	//    a) 访客对话 + AI 模式 + 访客发送的消息
	//    b) 内部对话（知识库测试）+ 客服发送的消息
	needAIReply := s.aiService != nil && (
		(conv.ChatMode == "ai" && !input.SenderIsAgent) ||
		(conv.ConversationType == "internal" && input.SenderIsAgent))
	if needAIReply {
		go func() {
			// 用于查找 AI 配置的用户 ID：访客对话用 AgentID，内部对话用发送者（客服）ID
			userID := conv.AgentID
			if userID == 0 {
				userID = 1
			}
			if conv.ConversationType == "internal" && input.SenderID > 0 {
				userID = input.SenderID
			}

			aiResponse, err := s.aiService.GenerateAIResponse(message.ConversationID, input.Content, userID)
			if err != nil {
				log.Printf("❌ AI 生成回复失败: %v", err)
				// 使用友好的错误消息
				aiResponse = "AI客服好像出了点差错，请联系人工客服解决"
			}

			// 创建 AI 回复消息
			aiMessage := &models.Message{
				ConversationID: message.ConversationID,
				SenderID:       0, // AI 消息的 SenderID 为 0
				SenderIsAgent:  true, // AI 回复视为客服消息
				Content:        aiResponse,
				MessageType:    "user_message",
				ChatMode:       "ai", // AI 回复消息的模式为 "ai"
				IsRead:         false,
			}

			if err := s.messages.Create(aiMessage); err != nil {
				log.Printf("❌ 创建 AI 回复消息失败: %v", err)
				return
			}

			// 更新对话的更新时间
			if err := s.conversations.UpdateFields(conv.ID, map[string]interface{}{
				"updated_at": aiMessage.CreatedAt,
			}); err != nil {
				log.Printf("⚠️ 更新对话时间失败: %v", err)
			}

			// 广播 AI 回复消息
			if s.hub != nil {
				// AI 回复只广播给访客，不广播给客服（避免干扰）
				// 客服可以在会话页面手动开启"显示 AI 消息"来查看
				s.hub.BroadcastMessage(aiMessage.ConversationID, "new_message", aiMessage)
				// 不再广播到所有客服
				// s.hub.BroadcastToAllAgents("new_message", aiMessage)
			}
		}()
	}

	return message, nil
}

// ListMessages 返回会话内的消息列表。
// includeAIMessages: 是否包含 AI 消息（默认 false，不包含）
// 如果 includeAIMessages == false，过滤掉所有 chat_mode == "ai" 的消息
// 这样就能准确区分 AI 模式下的消息和人工模式下的消息，即使对话模式切换了也能正确过滤
func (s *MessageService) ListMessages(conversationID uint, includeAIMessages bool) ([]models.Message, error) {
	messages, err := s.messages.ListByConversationID(conversationID)
	if err != nil {
		return nil, err
	}

	// 如果不包含 AI 消息，过滤掉所有 chat_mode == "ai" 的消息
	// 这样，无论对话当前是什么模式，都能准确过滤掉 AI 模式下的所有消息
	// 包括：访客在 AI 模式下发送的消息、AI 回复消息
	if !includeAIMessages {
		filtered := make([]models.Message, 0, len(messages))
		for _, msg := range messages {
			// 只显示 chat_mode != "ai" 的消息（人工模式下的消息）
			// 如果 chat_mode 为空（兼容历史数据），则根据 SenderID 和 SenderIsAgent 判断
			if msg.ChatMode != "" {
				// 有 chat_mode 字段，直接根据字段过滤
				if msg.ChatMode != "ai" {
					filtered = append(filtered, msg)
				}
			} else {
				// 兼容历史数据：chat_mode 为空时，使用旧逻辑
				// 过滤掉 AI 回复消息（SenderID == 0 && SenderIsAgent == true）
				if msg.SenderID != 0 || !msg.SenderIsAgent {
					filtered = append(filtered, msg)
				}
			}
		}
		return filtered, nil
	}

	return messages, nil
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
