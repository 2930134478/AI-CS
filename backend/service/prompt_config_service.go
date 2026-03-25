package service

import (
	"errors"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
)

// PromptConfigService 系统提示词配置服务（供「提示词」页与 AIService 使用）
type PromptConfigService struct {
	repo     *repository.PromptConfigRepository
	userRepo *repository.UserRepository
}

// NewPromptConfigService 创建服务实例
func NewPromptConfigService(repo *repository.PromptConfigRepository, userRepo *repository.UserRepository) *PromptConfigService {
	return &PromptConfigService{repo: repo, userRepo: userRepo}
}

// GetPrompt 按 key 获取配置内容，未配置返回空字符串
func (s *PromptConfigService) GetPrompt(key string) (string, error) {
	c, err := s.repo.Get(key)
	if err != nil {
		return "", err
	}
	if c == nil {
		return "", nil
	}
	return c.Content, nil
}

// GetPromptOrDefault 获取配置内容，若为空则返回 defaultContent（供 AIService 使用）
func (s *PromptConfigService) GetPromptOrDefault(key, defaultContent string) (string, error) {
	content, err := s.GetPrompt(key)
	if err != nil {
		return "", err
	}
	if content != "" {
		return content, nil
	}
	return defaultContent, nil
}

// PromptItem 返回给前端的单项（含展示名）
type PromptItem struct {
	Key       string    `json:"key"`
	Name      string    `json:"name"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

// GetPromptName 返回 key 对应的中文展示名
func GetPromptName(key string) string {
	switch key {
	case models.PromptKeyRAG:
		return "RAG 基础提示词（仅知识库）"
	case models.PromptKeyRAGWithWebOptional:
		return "RAG + 联网可选提示词"
	case models.PromptKeyNoKB:
		return "无知识库时的提示词"
	case models.PromptKeyWebSearchResult:
		return "联网结果拼接提示词"
	case models.PromptKeyNoSourceReply:
		return "无任何来源时的回复语"
	case models.PromptKeyAIFailReply:
		return "AI 调用失败时的回复语"
	default:
		return key
	}
}

// GetAllForAPI 获取所有已定义的 prompt 项（若 DB 无则返回默认内容，用于前端展示与编辑）
func (s *PromptConfigService) GetAllForAPI() ([]PromptItem, error) {
	keys := []string{
		models.PromptKeyRAG,
		models.PromptKeyRAGWithWebOptional,
		models.PromptKeyNoKB,
		models.PromptKeyWebSearchResult,
		models.PromptKeyNoSourceReply,
		models.PromptKeyAIFailReply,
	}
	list, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	byKey := make(map[string]*models.PromptConfig)
	for i := range list {
		byKey[list[i].Key] = &list[i]
	}
	out := make([]PromptItem, 0, len(keys))
	for _, k := range keys {
		item := PromptItem{Key: k, Name: GetPromptName(k)}
		if c := byKey[k]; c != nil {
			item.Content = c.Content
			item.UpdatedAt = c.UpdatedAt
		}
		if item.Content == "" {
			item.Content = getDefaultPromptContent(k)
		}
		out = append(out, item)
	}
	return out, nil
}

func getDefaultPromptContent(key string) string {
	switch key {
	case models.PromptKeyRAG:
		return defaultRAGPrompt
	case models.PromptKeyRAGWithWebOptional:
		return defaultRAGPromptWithWebOptional
	case models.PromptKeyNoKB:
		return defaultNoKBPrompt
	case models.PromptKeyWebSearchResult:
		return defaultWebSearchResultPrompt
	case models.PromptKeyNoSourceReply:
		return defaultNoSourceReply
	case models.PromptKeyAIFailReply:
		return defaultAIFailReply
	default:
		return ""
	}
}

// 默认模板（占位符：{{rag_context}}、{{user_message}}）
const (
	defaultRAGPrompt = `你是一个智能客服助手，请基于以下知识库内容回答用户的问题。

知识库内容：
{{rag_context}}

用户问题：
{{user_message}}

请根据知识库内容回答用户的问题。如果知识库中没有相关信息，请礼貌地告知用户，并建议联系人工客服。

回答要求：
1. 基于知识库内容，提供准确、有用的回答
2. 如果知识库中有相关信息，请直接引用并解释
3. 如果知识库中没有相关信息，请诚实告知
4. 保持友好、专业的语气
5. 回答要简洁明了，避免冗长`

	defaultRAGPromptWithWebOptional = `你是一个智能客服助手。请优先基于以下知识库内容回答用户的问题。

知识库内容：
{{rag_context}}

用户问题：
{{user_message}}

回答要求：
1. 若知识库内容与问题明确相关，请基于知识库给出准确、简洁的回答。
2. 若知识库内容与问题无关或仅弱相关，可先基于你自身的知识回答，不必拘泥于知识库。
3. 若你自身知识仍不足以回答（例如需要最新资讯、实时数据），你可决定是否使用联网搜索获取信息后再回答。
4. 保持友好、专业，回答简洁明了。`

	defaultNoKBPrompt = `你是一个智能客服助手。当前未使用知识库，请仅基于你的知识回答用户问题。

用户问题：
{{user_message}}

请简洁、友好地回答。若无法回答，可建议用户联系人工客服。`

	defaultWebSearchResultPrompt = `你是一个智能客服助手。请结合以下联网搜索结果回答用户问题。

联网搜索结果：
{{web_context}}

用户问题：
{{user_message}}

请基于以上内容给出简洁、准确的回答。`

	defaultNoSourceReply = "当前知识库暂无与此问题相关的内容，您可以尝试联系人工客服。"

	defaultAIFailReply = "AI客服好像出了点差错，请联系人工客服解决"
)

// Update 更新指定 key 的提示词内容（仅管理员）
func (s *PromptConfigService) Update(userID uint, key, content string) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil || user == nil {
		return errors.New("用户不存在")
	}
	if user.Role != "admin" {
		return errors.New("仅管理员可修改提示词配置")
	}
	allowedKeys := map[string]bool{
		models.PromptKeyRAG:                true,
		models.PromptKeyRAGWithWebOptional: true,
		models.PromptKeyNoKB:               true,
		models.PromptKeyWebSearchResult:    true,
		models.PromptKeyNoSourceReply:      true,
		models.PromptKeyAIFailReply:        true,
	}
	if !allowedKeys[key] {
		return errors.New("不支持的提示词 key")
	}
	c, _ := s.repo.Get(key)
	if c == nil {
		c = &models.PromptConfig{Key: key}
	}
	c.Content = content
	c.UpdatedAt = time.Now()
	return s.repo.Save(c)
}

// GetRAGPromptTemplate 供 AIService 使用：返回 RAG 基础提示词模板（配置或默认），占位符 {{rag_context}}、{{user_message}}
func (s *PromptConfigService) GetRAGPromptTemplate() (string, error) {
	return s.GetPromptOrDefault(models.PromptKeyRAG, defaultRAGPrompt)
}

// GetRAGPromptWithWebOptionalTemplate 供 AIService 使用：返回 RAG+联网可选提示词模板
func (s *PromptConfigService) GetRAGPromptWithWebOptionalTemplate() (string, error) {
	return s.GetPromptOrDefault(models.PromptKeyRAGWithWebOptional, defaultRAGPromptWithWebOptional)
}

// GetNoKBPromptTemplate 供 AIService 使用：无知识库时的提示词，占位符 {{user_message}}
func (s *PromptConfigService) GetNoKBPromptTemplate() (string, error) {
	return s.GetPromptOrDefault(models.PromptKeyNoKB, defaultNoKBPrompt)
}

// GetWebSearchResultPromptTemplate 供 AIService 使用：联网结果拼接提示词，占位符 {{web_context}}、{{user_message}}
func (s *PromptConfigService) GetWebSearchResultPromptTemplate() (string, error) {
	return s.GetPromptOrDefault(models.PromptKeyWebSearchResult, defaultWebSearchResultPrompt)
}

// GetNoSourceReply 供 AIService 使用：无任何来源时直接返回给用户的一句话（无占位符）
func (s *PromptConfigService) GetNoSourceReply() (string, error) {
	return s.GetPromptOrDefault(models.PromptKeyNoSourceReply, defaultNoSourceReply)
}

// GetAIFailReply 供 AIService 使用：AI 调用失败时返回给用户的一句话（无占位符）
func (s *PromptConfigService) GetAIFailReply() (string, error) {
	return s.GetPromptOrDefault(models.PromptKeyAIFailReply, defaultAIFailReply)
}
