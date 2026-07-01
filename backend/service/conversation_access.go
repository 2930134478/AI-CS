package service

import (
	"crypto/subtle"
	"errors"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/utils"
	"gorm.io/gorm"
)

// ErrConversationAccessDenied 表示无权访问该会话（如缺少或错误的 access_token）。
var ErrConversationAccessDenied = errors.New("无权限访问该会话")

// EnsureConversationAccessToken 若会话尚无令牌则生成并持久化（兼容历史数据）。
func (s *ConversationService) EnsureConversationAccessToken(conv *models.Conversation) (*models.Conversation, error) {
	if conv == nil {
		return nil, ErrConversationNotFound
	}
	if conv.AccessToken != "" {
		return conv, nil
	}
	token, err := utils.GenerateConversationAccessToken()
	if err != nil {
		return nil, err
	}
	if err := s.conversations.UpdateFields(conv.ID, map[string]interface{}{
		"access_token": token,
	}); err != nil {
		return nil, err
	}
	conv.AccessToken = token
	return conv, nil
}

// ValidateVisitorAccessToken 校验访客持有的会话 access_token。
func (s *ConversationService) ValidateVisitorAccessToken(conversationID uint, accessToken string) error {
	if conversationID == 0 || accessToken == "" {
		return ErrConversationAccessDenied
	}
	conv, err := s.conversations.GetByID(conversationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrConversationNotFound
		}
		return err
	}
	if conv.ConversationType != "visitor" {
		return ErrConversationAccessDenied
	}
	conv, err = s.EnsureConversationAccessToken(conv)
	if err != nil {
		return err
	}
	if subtle.ConstantTimeCompare([]byte(accessToken), []byte(conv.AccessToken)) != 1 {
		return ErrConversationAccessDenied
	}
	return nil
}
