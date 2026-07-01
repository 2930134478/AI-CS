package service

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
)

const (
	defaultConversationPageSize = 50
	maxConversationPageSize       = 100
)

func parseConversationListPagination(page, pageSize int) (int, int) {
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = defaultConversationPageSize
	}
	if pageSize > maxConversationPageSize {
		pageSize = maxConversationPageSize
	}
	return page, pageSize
}

func (s *ConversationService) buildSummariesBatch(conversations []models.Conversation, userID uint) ([]ConversationSummary, error) {
	if len(conversations) == 0 {
		return []ConversationSummary{}, nil
	}

	ids := make([]uint, len(conversations))
	for i, conv := range conversations {
		ids[i] = conv.ID
	}

	latestMap, err := s.messages.BatchLatestByConversationIDs(ids)
	if err != nil {
		return nil, err
	}
	unreadMap, err := s.messages.BatchCountUnreadBySender(ids, false)
	if err != nil {
		return nil, err
	}
	participatedMap := map[uint]bool{}
	if userID > 0 {
		participatedMap, err = s.messages.BatchHasAgentParticipated(ids, userID)
		if err != nil {
			return nil, err
		}
	}

	result := make([]ConversationSummary, 0, len(conversations))
	for _, conv := range conversations {
		var lastSeen *time.Time
		if conv.LastSeenAt != nil {
			lastSeen = conv.LastSeenAt
		}

		summary := ConversationSummary{
			ID:               conv.ID,
			ConversationType: conv.ConversationType,
			VisitorID:        conv.VisitorID,
			AgentID:          conv.AgentID,
			Status:           conv.Status,
			ChatMode:         conv.ChatMode,
			CreatedAt:        conv.CreatedAt,
			UpdatedAt:        conv.UpdatedAt,
			LastSeenAt:       lastSeen,
			UnreadCount:      unreadMap[conv.ID],
			HasParticipated:  participatedMap[conv.ID],
		}

		if message := latestMap[conv.ID]; message != nil {
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

		result = append(result, summary)
	}
	return result, nil
}

// ListConversationsPaginated 分页返回访客会话列表（批量 SQL，无 N+1）。
func (s *ConversationService) ListConversationsPaginated(userID uint, status string, page, pageSize int) (*ConversationListResult, error) {
	if status == "" {
		status = "open"
	}
	page, pageSize = parseConversationListPagination(page, pageSize)
	offset := (page - 1) * pageSize

	conversations, total, err := s.conversations.ListVisitorForAgentList(status, offset, pageSize)
	if err != nil {
		return nil, err
	}

	items, err := s.buildSummariesBatch(conversations, userID)
	if err != nil {
		return nil, err
	}

	totalUnread, err := s.messages.CountTotalUnreadVisitorForAgentList(status)
	if err != nil {
		totalUnread = 0
	}

	return &ConversationListResult{
		Items:       items,
		Total:       total,
		Page:        page,
		PageSize:    pageSize,
		HasMore:     int64(offset+len(items)) < total,
		TotalUnread: totalUnread,
	}, nil
}

// ListInternalConversationsPaginated 分页返回内部对话列表。
func (s *ConversationService) ListInternalConversationsPaginated(agentID uint, status string, page, pageSize int) (*ConversationListResult, error) {
	if agentID == 0 {
		return &ConversationListResult{Items: []ConversationSummary{}, Page: 1, PageSize: defaultConversationPageSize}, nil
	}
	if status == "" {
		status = "open"
	}
	page, pageSize = parseConversationListPagination(page, pageSize)

	conversations, err := s.conversations.ListInternalByAgentIDAndStatus(agentID, status)
	if err != nil {
		return nil, err
	}

	total := int64(len(conversations))
	offset := (page - 1) * pageSize
	if offset > len(conversations) {
		offset = len(conversations)
	}
	end := offset + pageSize
	if end > len(conversations) {
		end = len(conversations)
	}
	pageItems := conversations[offset:end]

	items, err := s.buildSummariesBatch(pageItems, agentID)
	if err != nil {
		return nil, err
	}

	return &ConversationListResult{
		Items:   items,
		Total:   total,
		Page:    page,
		PageSize: pageSize,
		HasMore: int64(offset+len(items)) < total,
	}, nil
}

// AutoCloseConversationDaysPolicy 自动关闭 stale 会话的策略（数据库覆盖优先于 .env）。
type AutoCloseConversationDaysPolicy struct {
	EffectiveDays       int  `json:"effective_days"`
	EnvDays             int  `json:"env_days"`
	PersistedInDatabase bool `json:"persisted_in_database"`
}

func autoCloseConversationDaysFromEnv() int {
	days := 7
	if v := os.Getenv("AUTO_CLOSE_CONVERSATION_DAYS"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil {
			days = parsed
		}
	}
	return days
}

// EffectiveAutoCloseConversationDays 返回当前生效的自动关闭天数（0=禁用）。
func (s *ConversationService) EffectiveAutoCloseConversationDays() int {
	if s.appSettings != nil {
		if row, err := s.appSettings.Get(models.AppSettingKeyAutoCloseConversationDays); err == nil && row != nil {
			if v := strings.TrimSpace(row.Value); v != "" {
				if parsed, err := strconv.Atoi(v); err == nil && parsed >= 0 {
					return parsed
				}
			}
		}
	}
	return autoCloseConversationDaysFromEnv()
}

// GetAutoCloseConversationDaysPolicy 读取自动关闭 stale 会话策略。
func (s *ConversationService) GetAutoCloseConversationDaysPolicy() AutoCloseConversationDaysPolicy {
	envDays := autoCloseConversationDaysFromEnv()
	policy := AutoCloseConversationDaysPolicy{
		EffectiveDays: envDays,
		EnvDays:       envDays,
	}
	if s.appSettings != nil {
		if row, err := s.appSettings.Get(models.AppSettingKeyAutoCloseConversationDays); err == nil && row != nil {
			if v := strings.TrimSpace(row.Value); v != "" {
				policy.PersistedInDatabase = true
				if parsed, err := strconv.Atoi(v); err == nil && parsed >= 0 {
					policy.EffectiveDays = parsed
				}
			}
		}
	}
	return policy
}

// SetAutoCloseConversationDaysPolicy 写入自动关闭天数（0=禁用）。
func (s *ConversationService) SetAutoCloseConversationDaysPolicy(inactiveDays int) error {
	if inactiveDays < 0 {
		return errors.New("inactive_days 不能为负数")
	}
	if s.appSettings == nil {
		return errors.New("配置存储不可用")
	}
	return s.appSettings.SetValue(models.AppSettingKeyAutoCloseConversationDays, strconv.Itoa(inactiveDays))
}

// ClearAutoCloseConversationDaysPolicy 删除数据库覆盖，恢复为 .env 默认值。
func (s *ConversationService) ClearAutoCloseConversationDaysPolicy() error {
	if s.appSettings == nil {
		return errors.New("配置存储不可用")
	}
	return s.appSettings.Delete(models.AppSettingKeyAutoCloseConversationDays)
}

// CloseStaleOpenVisitorConversations 关闭超过指定天数未更新的 open 访客会话（仅改 status，不删记录）。
func (s *ConversationService) CloseStaleOpenVisitorConversations(inactiveDays int) (int64, error) {
	if inactiveDays <= 0 {
		return 0, nil
	}
	cutoff := time.Now().AddDate(0, 0, -inactiveDays)
	return s.conversations.CloseStaleOpenVisitorConversations(cutoff)
}

// StartStaleConversationCleanup 启动后台任务：定期关闭长期未活跃的 open 访客会话。
func (s *ConversationService) StartStaleConversationCleanup() {
	run := func() {
		inactiveDays := s.EffectiveAutoCloseConversationDays()
		if inactiveDays <= 0 {
			return
		}
		n, err := s.CloseStaleOpenVisitorConversations(inactiveDays)
		if err != nil {
			log.Printf("[会话维护] 自动关闭 stale 会话失败: %v", err)
			return
		}
		if n > 0 {
			log.Printf("[会话维护] 已自动关闭 %d 条超过 %d 天未更新的 open 访客会话", n, inactiveDays)
		}
	}

	if days := s.EffectiveAutoCloseConversationDays(); days <= 0 {
		log.Println("[会话维护] 自动关闭 stale 会话已禁用（effective_days=0）")
	} else {
		run()
	}

	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			run()
		}
	}()
}
