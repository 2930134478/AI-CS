package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/infra"
	"github.com/2930134478/AI-CS/backend/infra/search"
	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/service/rag"
	"github.com/2930134478/AI-CS/backend/utils"
	"gorm.io/gorm"
)

// AIService AI 服务（负责调用 AI 生成回复）
type AIService struct {
	aiConfigRepo       *repository.AIConfigRepository
	messageRepo        *repository.MessageRepository
	conversationRepo   *repository.ConversationRepository
	retrievalService   *rag.RetrievalService
	providerFactory    *AIProviderFactory
	webSearchProvider  search.WebSearchProvider // 可选，自建联网时用
	embeddingConfigSvc *EmbeddingConfigService  // 读取联网方式：厂商内置 / 自建
	promptConfigSvc    *PromptConfigService     // 可选，提示词配置（为空则用代码内默认）
	storageService     infra.StorageService     // 可选，用于多模态识图时读取消息附件
	systemLogSvc       *SystemLogService        // 可选，结构化日志服务
}

// NewAIService 创建 AI 服务实例。webSearchProvider、storageService 可为 nil。
func NewAIService(
	aiConfigRepo *repository.AIConfigRepository,
	messageRepo *repository.MessageRepository,
	conversationRepo *repository.ConversationRepository,
	retrievalService *rag.RetrievalService,
	webSearchProvider search.WebSearchProvider,
	embeddingConfigSvc *EmbeddingConfigService,
	promptConfigSvc *PromptConfigService,
	storageService infra.StorageService,
	systemLogSvc *SystemLogService,
) *AIService {
	return &AIService{
		aiConfigRepo:       aiConfigRepo,
		messageRepo:        messageRepo,
		conversationRepo:   conversationRepo,
		retrievalService:   retrievalService,
		providerFactory:    NewAIProviderFactory(),
		webSearchProvider:  webSearchProvider,
		embeddingConfigSvc: embeddingConfigSvc,
		promptConfigSvc:    promptConfigSvc,
		storageService:     storageService,
		systemLogSvc:       systemLogSvc,
	}
}

// GenerateAIResponse 为对话生成 AI 回复（兼容旧调用，使用默认数据源选项）。
// 返回: AI 回复内容，若失败返回错误。
func (s *AIService) GenerateAIResponse(conversationID uint, userMessage string, userID uint) (string, error) {
	res, err := s.GenerateAIResponseWithOptions(conversationID, userMessage, userID, nil)
	if err != nil {
		return "", err
	}
	return res.Content, nil
}

// GenerateAIResponseWithOptions 根据数据源开关生成一条合成回复，并返回使用的来源标记。
// opts 为 nil 时使用默认：知识库+大模型开，联网关。
func (s *AIService) GenerateAIResponseWithOptions(conversationID uint, userMessage string, userID uint, opts *GenerateAIResponseInput) (*GenerateAIResponseResult, error) {
	useKB := true
	useLLM := true
	useWeb := false
	needWeb := false
	if opts != nil {
		if opts.UseKnowledgeBase != nil {
			useKB = *opts.UseKnowledgeBase
		}
		if opts.UseLLM != nil {
			useLLM = *opts.UseLLM
		}
		if opts.UseWebSearch != nil {
			useWeb = *opts.UseWebSearch
		}
		needWeb = opts.NeedWebSearch
	}

	conversation, err := s.conversationRepo.GetByID(conversationID)
	if err != nil {
		return nil, fmt.Errorf("获取对话失败: %v", err)
	}

	// 以下 config 为「AI 配置」：对话/联网均使用此接口；与「知识库向量配置」（embedding，如 nekoai）无关。
	var config *models.AIConfig
	if conversation.AIConfigID != nil {
		config, err = s.aiConfigRepo.GetByID(*conversation.AIConfigID)
		if err != nil {
			return nil, fmt.Errorf("获取 AI 配置失败: %v", err)
		}
		if !config.IsActive {
			return nil, errors.New("该模型配置已禁用")
		}
	} else {
		config, err = s.aiConfigRepo.GetActiveByUserID(userID, "text")
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("未找到 AI 配置，请先在设置中配置 AI 服务")
			}
			return nil, fmt.Errorf("获取 AI 配置失败: %v", err)
		}
	}

	apiKey, err := utils.DecryptAPIKey(config.APIKey)
	if err != nil {
		return nil, fmt.Errorf("解密 API Key 失败: %v", err)
	}

	// 若当前 AI 配置为生图模型（model_type=image），则直接走生图逻辑，
	// 不参与 RAG/联网与文本对话流程。前端仍显示在「AI 客服」渠道下。
	if config.ModelType == "image" {
		log.Printf("[生图] 对话ID=%d 使用 model_type=image 配置 id=%d，走 GenerateImageReply", conversationID, config.ID)
		return s.GenerateImageReply(conversationID, userMessage, userID)
	}

	// 调试：确认本条对话实际使用的 AI 配置（便于排查联网/厂商内置是否走对接口）
	if needWeb || useWeb {
		convAIConfigID := "nil"
		if conversation.AIConfigID != nil {
			convAIConfigID = fmt.Sprintf("%d", *conversation.AIConfigID)
		}
		apiURLMask := config.APIURL
		if len(apiURLMask) > 50 {
			apiURLMask = apiURLMask[:50] + "..."
		}
		log.Printf("[联网] 对话ID=%d 使用的AI配置: conversation.ai_config_id=%s, config.id=%d, provider=%s, api_url=%s",
			conversationID, convAIConfigID, config.ID, config.Provider, apiURLMask)
	}

	history, err := s.buildConversationHistory(conversationID)
	if err != nil {
		log.Printf("⚠️ 获取对话历史失败: %v", err)
		history = []MessageHistory{}
	}

	// 多模态识图：当前条带图时读取文件并转 base64 供 provider 使用
	var imageBase64, imageMimeType string
	if opts != nil && opts.Attachment != nil && opts.Attachment.FileType == "image" && opts.Attachment.FileURL != "" && s.storageService != nil {
		data, err := s.storageService.ReadMessageFile(opts.Attachment.FileURL)
		if err != nil {
			log.Printf("⚠️ 读取消息图片失败: %v", err)
		} else {
			imageBase64 = base64.StdEncoding.EncodeToString(data)
			imageMimeType = opts.Attachment.MimeType
			if imageMimeType == "" {
				imageMimeType = "image/jpeg"
			}
		}
	}

	var ragContext string
	ragStartedAt := time.Now()
	if useKB && s.retrievalService != nil {
		ragContext, err = s.retrieveRAGContext(context.Background(), userMessage, conversation)
		if err != nil {
			log.Printf("⚠️ RAG 检索失败: %v", err)
		}
		if s.systemLogSvc != nil {
			hit := strings.TrimSpace(ragContext) != ""
			convID := conversationID
			uID := userID
			_ = s.systemLogSvc.Create(CreateSystemLogInput{
				Level:          "info",
				Category:       "rag",
				Event:          "rag_context_result",
				Source:         "backend",
				ConversationID: &convID,
				UserID:         &uID,
				Message:        "RAG 检索完成",
				Meta: map[string]interface{}{
					"hit":          hit,
					"context_len":  len(ragContext),
					"elapsed_ms":   time.Since(ragStartedAt).Milliseconds(),
					"use_kb":       useKB,
					"need_web":     needWeb,
					"use_web":      useWeb,
				},
			})
		}
	}

	var adapterConfig *AdapterConfig
	if config.AdapterConfig != "" {
		_ = json.Unmarshal([]byte(config.AdapterConfig), &adapterConfig)
	}
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
		return nil, fmt.Errorf("创建 AI 提供商失败: %v", err)
	}

	var sources []string
	enhancedMessage := userMessage

	// 1) 有知识库匹配：以知识库为主生成；若本回合允许联网，则用增强 prompt + 联网工具，由模型在无关/不足时用自身知识或联网
	if ragContext != "" {
		sources = append(sources, "knowledge_base")
		if needWeb && useWeb {
			webSource := "custom"
			if s.embeddingConfigSvc != nil {
				webSource, _ = s.embeddingConfigSvc.GetWebSearchSource()
			}
			enhancedMessage = s.buildRAGPromptWithWebOptional(userMessage, ragContext)
			content, usedWeb, err := s.generateWithWebTools(context.Background(), provider, history, enhancedMessage, webSource, imageBase64, imageMimeType)
			if err != nil {
				log.Printf("⚠️ RAG+联网（function calling）失败: %v，回退到仅 RAG", err)
				if s.systemLogSvc != nil {
					_ = s.systemLogSvc.Create(CreateSystemLogInput{
						Level:          "warn",
						Category:       "ai",
						Event:          "rag_web_fallback",
						Source:         "backend",
						ConversationID: &conversationID,
						UserID:         &userID,
						Message:        "RAG+联网失败，回退到仅RAG",
						Meta: map[string]interface{}{
							"error":      err.Error(),
							"web_source": webSource,
							"ai_config":  config.ID,
						},
					})
				}
				if webSource == "vendor" && (strings.Contains(err.Error(), "web_search") || strings.Contains(err.Error(), "Supported values")) {
					log.Printf("💡 提示：当前对话使用的 AI 配置接口不支持 type \"web_search\"。若需联网，请改用支持该能力的模型（如 Poixe），或在设置中将联网方式改为「自建」并配置 SERPER_API_KEY。")
				}
				enhancedMessage = s.buildRAGPrompt(userMessage, ragContext)
			} else if content != "" {
				sources = append(sources, "llm")
				if usedWeb {
					sources = append(sources, "web")
				}
				if s.systemLogSvc != nil {
					convID := conversationID
					uID := userID
					_ = s.systemLogSvc.Create(CreateSystemLogInput{
						Level:          "info",
						Category:       "ai",
						Event:          "ai_web_success",
						Source:         "backend",
						ConversationID: &convID,
						UserID:         &uID,
						Message:        "RAG+联网生成成功",
						Meta: map[string]interface{}{
							"sources": strings.Join(sources, ","),
						},
					})
				}
				return &GenerateAIResponseResult{
					Content:     content,
					SourcesUsed: strings.Join(sources, ","),
				}, nil
			} else {
				enhancedMessage = s.buildRAGPrompt(userMessage, ragContext)
			}
		} else {
			enhancedMessage = s.buildRAGPrompt(userMessage, ragContext)
		}
	} else {
		// 2) 无知识库匹配：本回合允许联网时走「模型决定搜」function calling；否则仅用大模型知识
		if needWeb && useWeb {
			webSource := "custom"
			if s.embeddingConfigSvc != nil {
				webSource, _ = s.embeddingConfigSvc.GetWebSearchSource()
			}
			content, usedWeb, err := s.generateWithWebTools(context.Background(), provider, history, userMessage, webSource, imageBase64, imageMimeType)
			if err != nil {
				log.Printf("⚠️ 联网（function calling）失败: %v，回退到仅大模型", err)
				if s.systemLogSvc != nil {
					_ = s.systemLogSvc.Create(CreateSystemLogInput{
						Level:          "warn",
						Category:       "ai",
						Event:          "web_fallback_to_llm",
						Source:         "backend",
						ConversationID: &conversationID,
						UserID:         &userID,
						Message:        "联网失败，回退到仅大模型",
						Meta: map[string]interface{}{
							"error":      err.Error(),
							"web_source": webSource,
							"ai_config":  config.ID,
						},
					})
				}
				if webSource == "vendor" && (strings.Contains(err.Error(), "web_search") || strings.Contains(err.Error(), "Supported values")) {
					log.Printf("💡 提示：当前对话使用的 AI 配置接口不支持 type \"web_search\"。若需联网，请改用支持该能力的模型（如 Poixe），或在设置中将联网方式改为「自建」并配置 SERPER_API_KEY。")
				}
			} else if content != "" {
				sources = append(sources, "llm")
				if usedWeb {
					sources = append(sources, "web")
				}
				if s.systemLogSvc != nil {
					convID := conversationID
					uID := userID
					_ = s.systemLogSvc.Create(CreateSystemLogInput{
						Level:          "info",
						Category:       "ai",
						Event:          "ai_web_success",
						Source:         "backend",
						ConversationID: &convID,
						UserID:         &uID,
						Message:        "联网生成成功",
						Meta: map[string]interface{}{
							"sources": strings.Join(sources, ","),
						},
					})
				}
				return &GenerateAIResponseResult{
					Content:     content,
					SourcesUsed: strings.Join(sources, ","),
				}, nil
			}
		}
		if useLLM && len(sources) == 0 {
			enhancedMessage = s.buildNoKBPrompt(userMessage)
			sources = append(sources, "llm")
		} else if useLLM && len(sources) > 0 {
			sources = append(sources, "llm")
		}
	}

	// 无任何来源时（例如 useKB 且无匹配，useLLM 关）：使用可配置回复语
	if len(sources) == 0 {
		reply := s.getNoSourceReply()
		return &GenerateAIResponseResult{
			Content:     reply,
			SourcesUsed: "",
		}, nil
	}

	response, err := provider.GenerateResponse(history, enhancedMessage, imageBase64, imageMimeType)
	if err != nil {
		log.Printf("❌ AI 调用失败: %v", err)
		if s.systemLogSvc != nil {
			_ = s.systemLogSvc.Create(CreateSystemLogInput{
				Level:          "error",
				Category:       "ai",
				Event:          "ai_generate_failed",
				Source:         "backend",
				ConversationID: &conversationID,
				UserID:         &userID,
				Message:        "AI 调用失败，返回兜底回复",
				Meta: map[string]interface{}{
					"error":     err.Error(),
					"ai_config": config.ID,
				},
			})
		}
		return &GenerateAIResponseResult{
			Content:          s.getAIFailReply(),
			SourcesUsed:      strings.Join(sources, ","),
			GenerationFailed: true,
		}, nil
	}
	if s.systemLogSvc != nil {
		convID := conversationID
		uID := userID
		event := "ai_llm_success"
		if strings.Contains(strings.Join(sources, ","), "knowledge_base") {
			event = "ai_rag_success"
		}
		_ = s.systemLogSvc.Create(CreateSystemLogInput{
			Level:          "info",
			Category:       "ai",
			Event:          event,
			Source:         "backend",
			ConversationID: &convID,
			UserID:         &uID,
			Message:        "AI 生成成功",
			Meta: map[string]interface{}{
				"sources": strings.Join(sources, ","),
			},
		})
	}

	return &GenerateAIResponseResult{
		Content:     response,
		SourcesUsed: strings.Join(sources, ","),
	}, nil
}

// GenerateImageReply 生图渠道专用：根据用户描述生成图片并保存到存储，返回说明文案与图片 URL。
func (s *AIService) GenerateImageReply(conversationID uint, prompt string, userID uint) (*GenerateAIResponseResult, error) {
	conversation, err := s.conversationRepo.GetByID(conversationID)
	if err != nil {
		return nil, fmt.Errorf("获取对话失败: %v", err)
	}
	if conversation.AIConfigID == nil {
		return nil, errors.New("生图渠道需要选择生图模型，请先在渠道中选择「生图绘画」并选择模型")
	}
	config, err := s.aiConfigRepo.GetByID(*conversation.AIConfigID)
	if err != nil {
		return nil, fmt.Errorf("获取 AI 配置失败: %v", err)
	}
	if !config.IsActive {
		return nil, errors.New("该生图模型已禁用")
	}
	if config.ModelType != "image" {
		return nil, fmt.Errorf("当前选择的不是生图模型，model_type=%s", config.ModelType)
	}
	apiKey, err := utils.DecryptAPIKey(config.APIKey)
	if err != nil {
		return nil, fmt.Errorf("解密 API Key 失败: %v", err)
	}
	var adapterConfig *AdapterConfig
	if config.AdapterConfig != "" {
		_ = json.Unmarshal([]byte(config.AdapterConfig), &adapterConfig)
	}
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
		return nil, err
	}
	imgProvider, ok := provider.(ImageGenerationProvider)
	if !ok {
		return nil, errors.New("当前提供商不支持生图")
	}
	imageData, mimeType, err := imgProvider.GenerateImage(prompt)
	if err != nil {
		return nil, err
	}
	if s.storageService == nil {
		return nil, errors.New("存储服务未配置，无法保存生成图片")
	}
	ext := ".png"
	if strings.Contains(mimeType, "jpeg") || strings.Contains(mimeType, "jpg") {
		ext = ".jpg"
	}
	fileURL, err := s.storageService.SaveMessageFile(conversationID, bytes.NewReader(imageData), "generated"+ext)
	if err != nil {
		return nil, fmt.Errorf("保存生成图片失败: %v", err)
	}
	content := "已根据您的描述生成图片。"
	return &GenerateAIResponseResult{
		Content:          content,
		SourcesUsed:      "",
		GeneratedFileURL: &fileURL,
	}, nil
}

func (s *AIService) buildNoKBPrompt(userMessage string) string {
	if s.promptConfigSvc != nil {
		tpl, err := s.promptConfigSvc.GetNoKBPromptTemplate()
		if err == nil && tpl != "" {
			return replaceUserMessageOnly(tpl, userMessage)
		}
	}
	return fmt.Sprintf(`你是一个智能客服助手。当前未使用知识库，请仅基于你的知识回答用户问题。

用户问题：%s

请简洁、友好地回答。若无法回答，可建议用户联系人工客服。`, userMessage)
}

func (s *AIService) buildWebSearchPrompt(userMessage string, webContext string) string {
	if s.promptConfigSvc != nil {
		tpl, err := s.promptConfigSvc.GetWebSearchResultPromptTemplate()
		if err == nil && tpl != "" {
			return replaceWebSearchPlaceholders(tpl, webContext, userMessage)
		}
	}
	return fmt.Sprintf(`你是一个智能客服助手。请结合以下联网搜索结果回答用户问题。

联网搜索结果：
%s

用户问题：%s

请基于以上内容给出简洁、准确的回答。`, webContext, userMessage)
}

// replaceUserMessageOnly 仅替换 {{user_message}}
func replaceUserMessageOnly(template, userMessage string) string {
	return strings.ReplaceAll(template, "{{user_message}}", userMessage)
}

// replaceWebSearchPlaceholders 替换 {{web_context}}、{{user_message}}
func replaceWebSearchPlaceholders(template, webContext, userMessage string) string {
	template = strings.ReplaceAll(template, "{{web_context}}", webContext)
	template = strings.ReplaceAll(template, "{{user_message}}", userMessage)
	return template
}

// getNoSourceReply 无任何来源时返回给用户的一句话（可配置）
func (s *AIService) getNoSourceReply() string {
	if s.promptConfigSvc != nil {
		reply, err := s.promptConfigSvc.GetNoSourceReply()
		if err == nil && strings.TrimSpace(reply) != "" {
			return strings.TrimSpace(reply)
		}
	}
	return "当前知识库暂无与此问题相关的内容，您可以尝试联系人工客服。"
}

// getAIFailReply AI 调用失败时返回给用户的一句话（可配置）
func (s *AIService) getAIFailReply() string {
	if s.promptConfigSvc != nil {
		reply, err := s.promptConfigSvc.GetAIFailReply()
		if err == nil && strings.TrimSpace(reply) != "" {
			return strings.TrimSpace(reply)
		}
	}
	return "AI客服好像出了点差错，请联系人工客服解决"
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
// 返回: 增强后的用户消息（包含知识库上下文）。若已配置提示词服务则使用可配置模板（占位符 {{rag_context}}、{{user_message}}），否则使用代码内默认。
func (s *AIService) buildRAGPrompt(userMessage string, ragContext string) string {
	if s.promptConfigSvc != nil {
		tpl, err := s.promptConfigSvc.GetRAGPromptTemplate()
		if err == nil && tpl != "" {
			return replacePromptPlaceholders(tpl, ragContext, userMessage)
		}
	}
	return s.buildRAGPromptFallback(userMessage, ragContext)
}

// buildRAGPromptFallback 代码内默认 RAG 提示词（与 prompt_config_service 默认一致，用于 promptConfigSvc 为空或出错时）
func (s *AIService) buildRAGPromptFallback(userMessage string, ragContext string) string {
	return fmt.Sprintf(`你是一个智能客服助手，请基于以下知识库内容回答用户的问题。

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
}

// replacePromptPlaceholders 将模板中的 {{rag_context}}、{{user_message}} 替换为实际值
func replacePromptPlaceholders(template, ragContext, userMessage string) string {
	template = strings.ReplaceAll(template, "{{rag_context}}", ragContext)
	template = strings.ReplaceAll(template, "{{user_message}}", userMessage)
	return template
}

// buildRAGPromptWithWebOptional 构建 RAG prompt，并允许在知识库无关或不足时用自身知识或联网。
// 与 buildRAGPrompt 区别：明确说明可先基于知识库，若无关/弱相关可基于自身知识，若仍不足可由模型决定是否联网（需配合传入 web_search 工具使用）。
func (s *AIService) buildRAGPromptWithWebOptional(userMessage string, ragContext string) string {
	if s.promptConfigSvc != nil {
		tpl, err := s.promptConfigSvc.GetRAGPromptWithWebOptionalTemplate()
		if err == nil && tpl != "" {
			return replacePromptPlaceholders(tpl, ragContext, userMessage)
		}
	}
	return s.buildRAGPromptWithWebOptionalFallback(userMessage, ragContext)
}

// buildRAGPromptWithWebOptionalFallback 代码内默认（RAG+联网可选）
func (s *AIService) buildRAGPromptWithWebOptionalFallback(userMessage string, ragContext string) string {
	return fmt.Sprintf(`你是一个智能客服助手。请优先基于以下知识库内容回答用户的问题。

知识库内容：
%s

用户问题：%s

回答要求：
1. 若知识库内容与问题明确相关，请基于知识库给出准确、简洁的回答。
2. 若知识库内容与问题无关或仅弱相关，可先基于你自身的知识回答，不必拘泥于知识库。
3. 若你自身知识仍不足以回答（例如需要最新资讯、实时数据），你可决定是否使用联网搜索获取信息后再回答。
4. 保持友好、专业，回答简洁明了。`, ragContext, userMessage)
}

const maxWebToolRounds = 5

// webSearchToolDefinition 返回 type: "function" 的 web_search 工具定义，仅用于「自建」联网（Serper 执行）。
func (s *AIService) webSearchToolDefinition() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"type": "function",
			"function": map[string]interface{}{
				"name":        "web_search",
				"description": "Search the web for current information. Use when you need up-to-date or external information to answer the user.",
				"parameters": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"query": map[string]string{"type": "string", "description": "Search query"},
					},
					"required": []string{"query"},
				},
			},
		},
	}
}

// generateWithWebTools 使用 function calling 做联网（模型决定是否搜）。webSource: vendor / custom。
// 联网请求始终发往当前对话的「AI 配置」对话接口（与知识库向量配置/embedding 无关）。
// - vendor（模式一：厂商内置）：在 tools 里传 type "web_search"，由厂商在自家 API 内封装并执行搜索，无需自建。
// - custom（模式二：自建）：在 tools 里传 type "function" 的自定义函数（如 web_search），由本服务调用 Serper 等执行并回填。
func (s *AIService) generateWithWebTools(ctx context.Context, provider AIProvider, history []MessageHistory, userMessage string, webSource string, imageBase64 string, imageMimeType string) (content string, usedWeb bool, err error) {
	messages := s.historyToOpenAIMessages(history, userMessage, imageBase64, imageMimeType)
	var tools []map[string]interface{}
	useFunctionFormat := false
	switch webSource {
	case "vendor":
		// 模式一：厂商内置，仅传 web_search，由厂商执行
		tools = []map[string]interface{}{
			{"type": "web_search"},
		}
	case "custom":
		if s.webSearchProvider == nil {
			return "", false, nil
		}
		useFunctionFormat = true
		tools = s.webSearchToolDefinition()
	default:
		tools = nil
	}
	if len(tools) == 0 {
		return "", false, nil
	}

	rounds := 0
	for rounds < maxWebToolRounds {
		rounds++
		respContent, toolCalls, callErr := provider.GenerateResponseWithTools(messages, tools)
		if callErr != nil {
			return "", usedWeb, callErr
		}
		if len(toolCalls) == 0 {
			return respContent, usedWeb, nil
		}
		if useFunctionFormat {
			usedWeb = true
		}
		// 追加 assistant 消息（含 tool_calls）
		assistantMsg := map[string]interface{}{"role": "assistant", "content": respContent}
		tcList := make([]map[string]interface{}, 0, len(toolCalls))
		for _, tc := range toolCalls {
			tcList = append(tcList, map[string]interface{}{
				"id":       tc.ID,
				"type":     "function",
				"function": map[string]interface{}{"name": tc.Name, "arguments": tc.Arguments},
			})
		}
		assistantMsg["tool_calls"] = tcList
		messages = append(messages, assistantMsg)

		for _, tc := range toolCalls {
			toolResult := ""
			if useFunctionFormat && tc.Name == "web_search" && s.webSearchProvider != nil {
				var args struct {
					Query string `json:"query"`
				}
				_ = json.Unmarshal([]byte(tc.Arguments), &args)
				query := args.Query
				if query == "" {
					query = userMessage
				}
				toolResult, _ = s.webSearchProvider.Search(ctx, query)
			}
			messages = append(messages, map[string]interface{}{
				"role":         "tool",
				"tool_call_id": tc.ID,
				"content":      toolResult,
			})
		}
	}
	return "", usedWeb, fmt.Errorf("联网工具调用超过 %d 轮", maxWebToolRounds)
}

func (s *AIService) historyToOpenAIMessages(history []MessageHistory, userMessage string, imageBase64 string, imageMimeType string) []map[string]interface{} {
	out := make([]map[string]interface{}, 0, len(history)+1)
	for _, h := range history {
		out = append(out, map[string]interface{}{"role": h.Role, "content": h.Content})
	}
	var lastContent interface{} = userMessage
	if imageBase64 != "" {
		dataURL := "data:" + imageMimeType + ";base64," + imageBase64
		if imageMimeType == "" {
			dataURL = "data:image/jpeg;base64," + imageBase64
		}
		lastContent = []map[string]interface{}{
			{"type": "text", "text": userMessage},
			{"type": "image_url", "image_url": map[string]string{"url": dataURL}},
		}
	}
	out = append(out, map[string]interface{}{"role": "user", "content": lastContent})
	return out
}
