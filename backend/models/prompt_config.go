package models

import "time"

// PromptConfig 系统提示词配置（按 key 存储，供客服/管理员在「提示词」页配置）
// 用于 RAG、联网等场景的 prompt 模板；支持占位符 {{rag_context}}、{{user_message}}
type PromptConfig struct {
	Key       string    `json:"key" gorm:"primaryKey;type:varchar(64)"`
	Content   string    `json:"content" gorm:"type:text"`
	UpdatedAt time.Time `json:"updated_at"`
}

// 已知的 prompt key（与前端、AIService 一致）
const (
	PromptKeyRAG                = "rag_prompt"
	PromptKeyRAGWithWebOptional = "rag_prompt_with_web_optional"
	PromptKeyNoKB               = "no_kb_prompt"             // 无知识库时，仅用模型自身知识
	PromptKeyWebSearchResult    = "web_search_result_prompt" // 联网结果拼接（占位符 {{web_context}}、{{user_message}}），当前流程未使用
	PromptKeyNoSourceReply      = "no_source_reply"          // 无任何来源时直接返回给用户的一句话
	PromptKeyAIFailReply        = "ai_fail_reply"            // AI 调用失败时返回给用户的一句话
)
