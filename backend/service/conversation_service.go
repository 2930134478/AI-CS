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
	aiConfigRepo  *repository.AIConfigRepository // 用于验证 AI 配置
	userRepo      *repository.UserRepository     // 用于查询用户设置
}

// NewConversationService 创建 ConversationService 实例。
func NewConversationService(
	conversations *repository.ConversationRepository,
	messages *repository.MessageRepository,
	aiConfigRepo *repository.AIConfigRepository,
	userRepo *repository.UserRepository,
) *ConversationService {
	return &ConversationService{
		conversations: conversations,
		messages:      messages,
		aiConfigRepo:  aiConfigRepo,
		userRepo:      userRepo,
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
			chatMode := input.ChatMode
			if chatMode == "" {
				chatMode = "human" // 默认人工客服
			}

			// 如果是 AI 模式，验证 AI 配置
			var aiConfigID *uint
			if chatMode == "ai" {
				if input.AIConfigID == nil || *input.AIConfigID == 0 {
					return nil, errors.New("AI 模式需要选择模型配置")
				}
				// 验证配置是否存在且开放
				config, err := s.aiConfigRepo.GetByID(*input.AIConfigID)
				if err != nil {
					return nil, errors.New("模型配置不存在")
				}
				if !config.IsPublic {
					return nil, errors.New("该模型未开放给访客使用")
				}
				if !config.IsActive {
					return nil, errors.New("该模型配置已禁用")
				}
				aiConfigID = input.AIConfigID
			}

			conv = &models.Conversation{
				ConversationType: "visitor",
				VisitorID:        input.VisitorID,
				Status:           "open",
				Website:          input.Website,
				Referrer:   input.Referrer,
				Browser:    input.Browser,
				OS:         input.OS,
				Language:   input.Language,
				IPAddress:  input.IPAddress,
				LastSeenAt: &now,
				ChatMode:   chatMode,
				AIConfigID: aiConfigID,
			}
			if err := s.conversations.Create(conv); err != nil {
				return nil, err
			}
			isNewConversation = true
		} else {
			return nil, err
		}
	} else {
		// 恢复已存在的对话
		now := time.Now()
		updates := map[string]interface{}{
			"last_seen_at": &now,
		}

		// 更新访客信息（如果之前没有）
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

		// 重要：如果用户选择了新的 ChatMode，更新对话模式
		// 这样访客可以在人工客服和 AI 客服之间切换
		if input.ChatMode != "" && input.ChatMode != conv.ChatMode {
			chatMode := input.ChatMode
			updates["chat_mode"] = chatMode

			// 如果是 AI 模式，验证并更新 AI 配置
			if chatMode == "ai" {
				if input.AIConfigID == nil || *input.AIConfigID == 0 {
					return nil, errors.New("AI 模式需要选择模型配置")
				}
				// 验证配置是否存在且开放
				config, err := s.aiConfigRepo.GetByID(*input.AIConfigID)
				if err != nil {
					return nil, errors.New("模型配置不存在")
				}
				if !config.IsPublic {
					return nil, errors.New("该模型未开放给访客使用")
				}
				if !config.IsActive {
					return nil, errors.New("该模型配置已禁用")
				}
				updates["ai_config_id"] = input.AIConfigID
			} else {
				// 切换到人工客服模式，清除 AI 配置
				updates["ai_config_id"] = nil
			}
		}

		if err := s.conversations.UpdateFields(conv.ID, updates); err != nil {
			return nil, err
		}

		// 重新获取更新后的对话信息
		conv, err = s.conversations.GetByID(conv.ID)
		if err != nil {
			return nil, err
		}
	}

	if isNewConversation {
		now := time.Now()
		chatMode := input.ChatMode
		if chatMode == "" {
			chatMode = "human" // 默认人工模式
		}
		message := &models.Message{
			ConversationID: conv.ID,
			SenderID:       0,
			SenderIsAgent:  false,
			Content:        "Visitor opened the page",
			MessageType:    "system_message",
			ChatMode:       chatMode, // 记录系统消息发送时的对话模式
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
			chatMode := input.ChatMode
			if chatMode == "" {
				chatMode = "human" // 默认人工模式
			}
			referrerMsg := &models.Message{
				ConversationID: conv.ID,
				SenderID:       0,
				SenderIsAgent:  false,
				Content:        "Visitor came from [" + input.Referrer + "]",
				MessageType:    "system_message",
				ChatMode:       chatMode, // 记录系统消息发送时的对话模式
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

	// UpdateConversationContact 不传递 userID，因为更新联系信息时不需要检查参与状态
	return s.GetConversationDetail(input.ConversationID, 0)
}

func (s *ConversationService) buildSummary(conv models.Conversation, userID uint) (ConversationSummary, error) {
	var lastSeen *time.Time
	if conv.LastSeenAt != nil {
		lastSeen = conv.LastSeenAt
	}

	// 检查当前用户是否参与过该会话（是否发送过消息）
	hasParticipated := false
	if userID > 0 {
		if participated, err := s.messages.HasAgentParticipated(conv.ID, userID); err == nil {
			hasParticipated = participated
		}
		// 错误时静默处理，不影响流程
	}

	summary := ConversationSummary{
		ID:               conv.ID,
		ConversationType: conv.ConversationType,
		VisitorID:        conv.VisitorID,
		AgentID:           conv.AgentID,
		Status:            conv.Status,
		ChatMode:          conv.ChatMode,
		CreatedAt:         conv.CreatedAt,
		UpdatedAt:         conv.UpdatedAt,
		LastSeenAt:        lastSeen,
		HasParticipated:   hasParticipated,
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
// userID: 当前登录的客服ID（可选，如果为0则使用默认过滤规则）
// 过滤规则：
// 1. 默认不显示 ChatMode == "ai" 的对话
// 2. 如果 userID > 0 且该用户的 ReceiveAIConversations == false，则不显示 AI 对话
// 3. 只显示 ChatMode == "human" 且存在访客消息的对话（访客切换到人工并发送消息后）
func (s *ConversationService) ListConversations(userID uint) ([]ConversationSummary, error) {
	conversations, err := s.conversations.ListActive()
	if err != nil {
		return nil, err
	}

	result := make([]ConversationSummary, 0, len(conversations))
	for _, conv := range conversations {
		// 过滤规则 1: 默认不显示 AI 对话
		// 只有在会话页面手动开启"显示 AI 对话"时才显示
		if conv.ChatMode == "ai" {
			continue
		}

		// 过滤规则 2: 如果是人工对话，检查是否有访客发送的消息
		// 只有当访客切换到人工并发送消息后，才显示在列表中
		if conv.ChatMode == "human" {
			hasVisitorMessage, err := s.messages.HasVisitorMessageInHumanMode(conv.ID)
			if err != nil {
				// 如果查询失败，为了安全起见，不显示该对话
				continue
			}
			if !hasVisitorMessage {
				// 没有访客消息，不显示（访客只是切换了模式，但还没发送消息）
				continue
			}
		}

		// 通过过滤，添加到结果列表
		summary, err := s.buildSummary(conv, userID)
		if err != nil {
			continue // 如果构建摘要失败，跳过该对话
		}
		result = append(result, summary)
	}
	return result, nil
}

// GetConversationDetail 获取指定会话的详细信息。内部对话仅创建者（agent_id）可查看。
func (s *ConversationService) GetConversationDetail(id uint, userID uint) (*ConversationDetail, error) {
	conv, err := s.conversations.GetByID(id)
	if err != nil {
		return nil, err
	}
	if conv.ConversationType == "internal" && userID > 0 && conv.AgentID != userID {
		return nil, gorm.ErrRecordNotFound
	}

	summary, err := s.buildSummary(*conv, userID)
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
// userID: 当前登录的客服ID（可选，用于检查参与状态）
func (s *ConversationService) SearchConversations(query string, userID uint) ([]ConversationSummary, error) {
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
		summary, err := s.buildSummary(conv, userID)
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

// InitInternalConversation 为客服创建一条新的内部对话（知识库测试用）。每次调用创建新会话。
func (s *ConversationService) InitInternalConversation(agentID uint) (*InitConversationResult, error) {
	if agentID == 0 {
		return nil, errors.New("agent_id is required for internal conversation")
	}
	conv := &models.Conversation{
		ConversationType: "internal",
		VisitorID:        0,
		AgentID:          agentID,
		Status:           "open",
		ChatMode:         "ai",
	}
	if err := s.conversations.Create(conv); err != nil {
		return nil, err
	}
	return &InitConversationResult{
		ConversationID: conv.ID,
		Status:         conv.Status,
	}, nil
}

// ListInternalConversations 返回当前客服的全部内部对话（知识库测试用）。
func (s *ConversationService) ListInternalConversations(agentID uint) ([]ConversationSummary, error) {
	if agentID == 0 {
		return []ConversationSummary{}, nil
	}
	conversations, err := s.conversations.ListActiveInternalByAgentID(agentID)
	if err != nil {
		return nil, err
	}
	result := make([]ConversationSummary, 0, len(conversations))
	for _, conv := range conversations {
		summary, err := s.buildSummary(conv, agentID)
		if err != nil {
			continue
		}
		result = append(result, summary)
	}
	return result, nil
}
