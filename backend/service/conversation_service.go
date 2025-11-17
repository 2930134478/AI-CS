package service

import (
	"errors"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"gorm.io/gorm"
)

// ConversationService 负责会话领域的业务编排。
type ConversationService struct {
	conversations *repository.ConversationRepository
	messages      *repository.MessageRepository
}

// NewConversationService 创建 ConversationService 实例。
func NewConversationService(
	conversations *repository.ConversationRepository,
	messages *repository.MessageRepository,
) *ConversationService {
	return &ConversationService{
		conversations: conversations,
		messages:      messages,
	}
}

// InitConversation 为访客创建或恢复会话。
func (s *ConversationService) InitConversation(input InitConversationInput) (*InitConversationResult, error) {
	var (
		conv *models.Conversation
		err  error
	)

	conv, err = s.conversations.FindOpenByVisitorID(input.VisitorID)
	isNewConversation := false

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			now := time.Now()
			conv = &models.Conversation{
				VisitorID:  input.VisitorID,
				Status:     "open",
				Website:    input.Website,
				Referrer:   input.Referrer,
				Browser:    input.Browser,
				OS:         input.OS,
				Language:   input.Language,
				IPAddress:  input.IPAddress,
				LastSeenAt: &now,
			}
			if err := s.conversations.Create(conv); err != nil {
				return nil, err
			}
			isNewConversation = true
		} else {
			return nil, err
		}
	} else {
		now := time.Now()
		updates := map[string]interface{}{
			"last_seen_at": &now,
		}
		if input.Website != "" && conv.Website == "" {
			updates["website"] = input.Website
		}
		if input.Referrer != "" && conv.Referrer == "" {
			updates["referrer"] = input.Referrer
		}
		if input.Browser != "" && conv.Browser == "" {
			updates["browser"] = input.Browser
		}
		if input.OS != "" && conv.OS == "" {
			updates["os"] = input.OS
		}
		if input.Language != "" && conv.Language == "" {
			updates["language"] = input.Language
		}
		if input.IPAddress != "" && conv.IPAddress == "" {
			updates["ip_address"] = input.IPAddress
		}
		if err := s.conversations.UpdateFields(conv.ID, updates); err != nil {
			return nil, err
		}
	}

	if isNewConversation {
		now := time.Now()
		message := &models.Message{
			ConversationID: conv.ID,
			SenderID:       0,
			SenderIsAgent:  false,
			Content:        "Visitor opened the page",
			MessageType:    "system_message",
			IsRead:         true,
			ReadAt:         &now,
		}
		if input.Website != "" {
			message.Content += " [" + input.Website + "]"
		}
		if err := s.messages.Create(message); err != nil {
			return nil, err
		}

		if input.Referrer != "" {
			readTime := time.Now()
			referrerMsg := &models.Message{
				ConversationID: conv.ID,
				SenderID:       0,
				SenderIsAgent:  false,
				Content:        "Visitor came from [" + input.Referrer + "]",
				MessageType:    "system_message",
				IsRead:         true,
				ReadAt:         &readTime,
			}
			if err := s.messages.Create(referrerMsg); err != nil {
				return nil, err
			}
		}
	}

	return &InitConversationResult{
		ConversationID: conv.ID,
		Status:         conv.Status,
	}, nil
}

// UpdateConversationContact 更新访客的联系信息（邮箱、电话、备注）。
func (s *ConversationService) UpdateConversationContact(input UpdateConversationContactInput) (*ConversationDetail, error) {
	if _, err := s.conversations.GetByID(input.ConversationID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrConversationNotFound
		}
		return nil, err
	}

	updates := map[string]interface{}{}

	if input.Email != nil {
		updates["email"] = strings.TrimSpace(*input.Email)
	}
	if input.Phone != nil {
		updates["phone"] = strings.TrimSpace(*input.Phone)
	}
	if input.Notes != nil {
		updates["notes"] = strings.TrimSpace(*input.Notes)
	}

	if err := s.conversations.UpdateFields(input.ConversationID, updates); err != nil {
		return nil, err
	}

	return s.GetConversationDetail(input.ConversationID)
}

func (s *ConversationService) buildSummary(conv models.Conversation) (ConversationSummary, error) {
	var lastSeen *time.Time
	if conv.LastSeenAt != nil {
		lastSeen = conv.LastSeenAt
	}
	summary := ConversationSummary{
		ID:         conv.ID,
		VisitorID:  conv.VisitorID,
		AgentID:    conv.AgentID,
		Status:     conv.Status,
		CreatedAt:  conv.CreatedAt,
		UpdatedAt:  conv.UpdatedAt,
		LastSeenAt: lastSeen, // 添加 last_seen_at 字段
	}

	if message, err := s.messages.LatestByConversationID(conv.ID); err == nil && message != nil {
		var readAt *time.Time
		if message.ReadAt != nil {
			readAt = message.ReadAt
		}
		summary.LastMessage = &LastMessageSummary{
			ID:            message.ID,
			Content:       message.Content,
			SenderIsAgent: message.SenderIsAgent,
			MessageType:   message.MessageType,
			IsRead:        message.IsRead,
			ReadAt:        readAt,
			CreatedAt:     message.CreatedAt,
		}
	}

	if count, err := s.messages.CountUnreadBySender(conv.ID, false); err == nil {
		summary.UnreadCount = count
	}

	return summary, nil
}

// ListConversations 返回当前活跃会话的摘要信息。
func (s *ConversationService) ListConversations() ([]ConversationSummary, error) {
	conversations, err := s.conversations.ListActive()
	if err != nil {
		return nil, err
	}

	result := make([]ConversationSummary, 0, len(conversations))
	for _, conv := range conversations {
		summary, err := s.buildSummary(conv)
		if err != nil {
			return nil, err
		}
		result = append(result, summary)
	}
	return result, nil
}

// GetConversationDetail 获取指定会话的详细信息。
func (s *ConversationService) GetConversationDetail(id uint) (*ConversationDetail, error) {
	conv, err := s.conversations.GetByID(id)
	if err != nil {
		return nil, err
	}

	summary, err := s.buildSummary(*conv)
	if err != nil {
		return nil, err
	}

	var lastSeen *time.Time
	if conv.LastSeenAt != nil {
		lastSeen = conv.LastSeenAt
	}

	return &ConversationDetail{
		ConversationSummary: summary,
		Website:             conv.Website,
		Referrer:            conv.Referrer,
		Browser:             conv.Browser,
		OS:                  conv.OS,
		Language:            conv.Language,
		IPAddress:           conv.IPAddress,
		Location:            conv.Location,
		Email:               conv.Email,
		Phone:               conv.Phone,
		Notes:               conv.Notes,
		LastSeen:            lastSeen,
	}, nil
}

// SearchConversations 根据关键字检索会话摘要。
func (s *ConversationService) SearchConversations(query string) ([]ConversationSummary, error) {
	pattern := "%" + query + "%"

	idSet := map[uint]struct{}{}

	if ids, err := s.messages.FindConversationIDsByContent(pattern); err == nil {
		for _, id := range ids {
			idSet[id] = struct{}{}
		}
	} else {
		return nil, err
	}

	if convs, err := s.conversations.SearchByIDOrVisitorLike(pattern); err == nil {
		for _, conv := range convs {
			idSet[conv.ID] = struct{}{}
		}
	} else {
		return nil, err
	}

	if len(idSet) == 0 {
		return []ConversationSummary{}, nil
	}

	ids := make([]uint, 0, len(idSet))
	for id := range idSet {
		ids = append(ids, id)
	}

	conversations, err := s.conversations.ListByIDs(ids)
	if err != nil {
		return nil, err
	}

	result := make([]ConversationSummary, 0, len(conversations))
	for _, conv := range conversations {
		summary, err := s.buildSummary(conv)
		if err != nil {
			return nil, err
		}
		result = append(result, summary)
	}
	return result, nil
}

// UpdateVisitorOnlineStatus 更新访客在线状态和最后活跃时间。
// 当 isOnline 为 true 时，更新 last_seen_at 为当前时间，并确保状态为 "open"。
// 当 isOnline 为 false 时，仅更新 last_seen_at 为当前时间，不改变状态。
func (s *ConversationService) UpdateVisitorOnlineStatus(conversationID uint, isOnline bool) error {
	now := time.Now()
	updates := map[string]interface{}{
		"last_seen_at": &now,
	}

	// 如果标记为在线，确保状态为 "open"（但不要将已关闭的会话重新打开）
	if isOnline {
		conv, err := s.conversations.GetByID(conversationID)
		if err != nil {
			return err
		}
		// 只有当前状态不是 "closed" 时，才更新为 "open"
		if conv.Status != "closed" {
			updates["status"] = "open"
		}
	}

	return s.conversations.UpdateFields(conversationID, updates)
}

// UpdateLastSeenAt 更新访客的最后活跃时间。
func (s *ConversationService) UpdateLastSeenAt(conversationID uint) error {
	now := time.Now()
	return s.conversations.UpdateFields(conversationID, map[string]interface{}{
		"last_seen_at": &now,
	})
}
