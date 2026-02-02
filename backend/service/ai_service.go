package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/service/rag"
	"github.com/2930134478/AI-CS/backend/utils"
	"gorm.io/gorm"
)

// AIService AI 服务（负责调用 AI 生成回复）
type AIService struct {
	aiConfigRepo     *repository.AIConfigRepository
	messageRepo      *repository.MessageRepository
	conversationRepo *repository.ConversationRepository
	retrievalService *rag.RetrievalService // RAG 检索服务
	providerFactory  *AIProviderFactory
}

// NewAIService 创建 AI 服务实例。
func NewAIService(
	aiConfigRepo *repository.AIConfigRepository,
	messageRepo *repository.MessageRepository,
	conversationRepo *repository.ConversationRepository,
	retrievalService *rag.RetrievalService, // 添加 RAG 检索服务
) *AIService {
	return &AIService{
		aiConfigRepo:     aiConfigRepo,
		messageRepo:      messageRepo,
		conversationRepo: conversationRepo,
		retrievalService: retrievalService,
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

	// 4. RAG 检索：从知识库中检索相关文档
	ragContext := ""
	if s.retrievalService != nil {
		ragContext, err = s.retrieveRAGContext(context.Background(), userMessage, conversation)
		if err != nil {
			log.Printf("⚠️ RAG 检索失败: %v，继续使用无知识库上下文", err)
			// RAG 检索失败不影响主流程，继续处理
		}
	}

	// 5. 构建增强的用户消息（包含 RAG 上下文）
	enhancedUserMessage := userMessage
	if ragContext != "" {
		enhancedUserMessage = s.buildRAGPrompt(userMessage, ragContext)
	}

	// 6. 解析适配器配置（如果有）
	var adapterConfig *AdapterConfig
	if config.AdapterConfig != "" {
		if err := json.Unmarshal([]byte(config.AdapterConfig), &adapterConfig); err != nil {
			log.Printf("⚠️ 解析适配器配置失败: %v，使用默认配置", err)
		}
	}

	// 7. 创建 AI 提供商
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

	// 8. 调用 AI 生成回复（使用增强的消息）
	response, err := provider.GenerateResponse(history, enhancedUserMessage)
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

// retrieveRAGContext 从知识库中检索相关文档内容
// query: 用户查询文本
// conversation: 对话信息（可能包含知识库 ID）
// 返回: 检索到的文档内容（格式化后的字符串）
func (s *AIService) retrieveRAGContext(ctx context.Context, query string, conversation *models.Conversation) (string, error) {
	// 确定知识库 ID（可以从对话中获取，或为空表示搜索所有知识库）
	// TODO: 后续在 Conversation 模型增加 KnowledgeBaseID 字段
	var knowledgeBaseID *uint
	// knowledgeBaseID = conversation.KnowledgeBaseID // 暂时注释，等模型字段添加后启用

	// 执行 RAG 检索（Top-K = 5，返回最相关的 5 个文档片段）
	// 使用重排序优化检索结果
	topK := 5
	results, err := s.retrievalService.RetrieveWithRerank(ctx, query, topK, knowledgeBaseID)
	if err != nil {
		return "", fmt.Errorf("RAG 检索失败: %w", err)
	}

	if len(results) == 0 {
		// 没有检索到相关文档
		return "", nil
	}

	// 格式化检索结果
	var contextParts []string
	for i, result := range results {
		// 只使用相似度较高的结果（Score 越小表示相似度越高）
		// 如果使用余弦相似度，通常阈值在 0.7-0.9 之间
		// 这里我们暂时不过滤，让所有结果都参与
		contextParts = append(contextParts, fmt.Sprintf("文档片段 %d:\n%s", i+1, result.Content))
	}

	return strings.Join(contextParts, "\n\n"), nil
}

// buildRAGPrompt 构建包含 RAG 上下文的 Prompt
// userMessage: 用户原始消息
// ragContext: RAG 检索到的文档内容
// 返回: 增强后的用户消息（包含知识库上下文）
func (s *AIService) buildRAGPrompt(userMessage string, ragContext string) string {
	// 构建 RAG Prompt 模板
	// 参考 PandaWiki 的 Prompt 格式
	prompt := fmt.Sprintf(`你是一个智能客服助手，请基于以下知识库内容回答用户的问题。

知识库内容：
%s

用户问题：%s

请根据知识库内容回答用户的问题。如果知识库中没有相关信息，请礼貌地告知用户，并建议联系人工客服。

回答要求：
1. 基于知识库内容，提供准确、有用的回答
2. 如果知识库中有相关信息，请直接引用并解释
3. 如果知识库中没有相关信息，请诚实告知
4. 保持友好、专业的语气
5. 回答要简洁明了，避免冗长`, ragContext, userMessage)

	return prompt
}
