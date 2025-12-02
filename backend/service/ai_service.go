package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/utils"
	"gorm.io/gorm"
)

// AIService AI 服务（负责调用 AI 生成回复）
type AIService struct {
	aiConfigRepo     *repository.AIConfigRepository
	messageRepo      *repository.MessageRepository
	conversationRepo *repository.ConversationRepository
	providerFactory  *AIProviderFactory
}

// NewAIService 创建 AI 服务实例。
func NewAIService(
	aiConfigRepo *repository.AIConfigRepository,
	messageRepo *repository.MessageRepository,
	conversationRepo *repository.ConversationRepository,
) *AIService {
	return &AIService{
		aiConfigRepo:     aiConfigRepo,
		messageRepo:      messageRepo,
		conversationRepo: conversationRepo,
		providerFactory:  NewAIProviderFactory(),
	}
}

// GenerateAIResponse 为对话生成 AI 回复。
// conversationID: 对话ID
// userMessage: 用户消息
// userID: 用户ID（用于回退查找 AI 配置）
// 返回: AI 回复内容，如果失败返回错误
func (s *AIService) GenerateAIResponse(conversationID uint, userMessage string, userID uint) (string, error) {
	// 1. 获取对话信息，优先使用对话绑定的 AI 配置
	conversation, err := s.conversationRepo.GetByID(conversationID)
	if err != nil {
		return "", fmt.Errorf("获取对话失败: %v", err)
	}
	
	var config *models.AIConfig
	if conversation.AIConfigID != nil {
		// 使用对话绑定的配置（多厂商支持）
		config, err = s.aiConfigRepo.GetByID(*conversation.AIConfigID)
		if err != nil {
			return "", fmt.Errorf("获取 AI 配置失败: %v", err)
		}
		// 验证配置是否启用
		if !config.IsActive {
			return "", errors.New("该模型配置已禁用")
		}
	} else {
		// 回退：使用用户默认配置（向后兼容）
		config, err = s.aiConfigRepo.GetActiveByUserID(userID, "text")
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return "", errors.New("未找到 AI 配置，请先在设置中配置 AI 服务")
			}
			return "", fmt.Errorf("获取 AI 配置失败: %v", err)
		}
	}

	// 2. 解密 API Key
	apiKey, err := utils.DecryptAPIKey(config.APIKey)
	if err != nil {
		return "", fmt.Errorf("解密 API Key 失败: %v", err)
	}

	// 3. 获取对话历史（用于上下文）
	history, err := s.buildConversationHistory(conversationID)
	if err != nil {
		log.Printf("⚠️ 获取对话历史失败: %v", err)
		// 即使获取历史失败，也继续处理（使用空历史）
		history = []MessageHistory{}
	}

	// 4. 解析适配器配置（如果有）
	var adapterConfig *AdapterConfig
	if config.AdapterConfig != "" {
		if err := json.Unmarshal([]byte(config.AdapterConfig), &adapterConfig); err != nil {
			log.Printf("⚠️ 解析适配器配置失败: %v，使用默认配置", err)
		}
	}

	// 5. 创建 AI 提供商
	aiConfig := AIConfig{
		APIURL:        config.APIURL,
		APIKey:        apiKey,
		Model:         config.Model,
		ModelType:     config.ModelType,
		Provider:      config.Provider,
		AdapterConfig: adapterConfig,
	}

	provider, err := s.providerFactory.CreateProvider(aiConfig)
	if err != nil {
		return "", fmt.Errorf("创建 AI 提供商失败: %v", err)
	}

	// 6. 调用 AI 生成回复
	response, err := provider.GenerateResponse(history, userMessage)
	if err != nil {
		// AI 调用失败，返回友好的错误消息
		log.Printf("❌ AI 调用失败: %v", err)
		return "AI客服好像出了点差错，请联系人工客服解决", nil
	}

	return response, nil
}

// buildConversationHistory 构建对话历史（用于 AI 上下文）。
func (s *AIService) buildConversationHistory(conversationID uint) ([]MessageHistory, error) {
	// 获取最近的对话消息（最多 10 条，避免上下文过长）
	messages, err := s.messageRepo.ListByConversationID(conversationID)
	if err != nil {
		return nil, err
	}

	// 只取最近 10 条消息
	startIdx := 0
	if len(messages) > 10 {
		startIdx = len(messages) - 10
	}

	history := make([]MessageHistory, 0)
	for i := startIdx; i < len(messages); i++ {
		msg := messages[i]
		// 跳过系统消息
		if msg.MessageType == "system_message" {
			continue
		}

		role := "user"
		if msg.SenderIsAgent {
			role = "assistant"
		}

		history = append(history, MessageHistory{
			Role:    role,
			Content: msg.Content,
		})
	}

	return history, nil
}

