package embedding

import (
	"fmt"
	"os"
)

// EmbeddingFactory 嵌入服务工厂
type EmbeddingFactory struct{}

// NewEmbeddingFactory 创建嵌入服务工厂
func NewEmbeddingFactory() *EmbeddingFactory {
	return &EmbeddingFactory{}
}

// getConfigFromEnv 从环境变量读取配置
func (f *EmbeddingFactory) getConfigFromEnv() (embeddingType, apiURL, apiKey, model string) {
	embeddingType = os.Getenv("EMBEDDING_TYPE")
	if embeddingType == "" {
		embeddingType = "local" // 默认使用本地 BGE
	}

	apiURL = os.Getenv("EMBEDDING_API_URL")
	apiKey = os.Getenv("EMBEDDING_API_KEY")
	model = os.Getenv("EMBEDDING_MODEL")

	// BGE 配置
	if embeddingType == "local" || embeddingType == "bge" {
		if bgeURL := os.Getenv("BGE_API_URL"); bgeURL != "" {
			apiURL = bgeURL
		}
		if bgeKey := os.Getenv("BGE_API_KEY"); bgeKey != "" {
			apiKey = bgeKey
		}
		if bgeModel := os.Getenv("BGE_MODEL_NAME"); bgeModel != "" {
			model = bgeModel
		}
	}

	return
}

// CreateDefaultEmbeddingService 创建默认嵌入服务
// 优先尝试 BGE 本地服务，如果失败则使用 OpenAI
func (f *EmbeddingFactory) CreateDefaultEmbeddingService() (EmbeddingService, error) {
	embeddingType, apiURL, apiKey, model := f.getConfigFromEnv()

	switch embeddingType {
	case "openai", "api":
		if apiKey == "" {
			return nil, fmt.Errorf("EMBEDDING_API_KEY 未设置")
		}
		return NewOpenAIEmbeddingService(apiURL, apiKey, model), nil

	case "local", "bge":
		// 尝试创建 BGE 服务
		return NewBGEEmbeddingService(apiURL, apiKey, model), nil

	default:
		return nil, fmt.Errorf("不支持的嵌入服务类型: %s", embeddingType)
	}
}

// CreateEmbeddingService 根据类型创建嵌入服务
func (f *EmbeddingFactory) CreateEmbeddingService(embeddingType string) (EmbeddingService, error) {
	_, apiURL, apiKey, model := f.getConfigFromEnv()

	switch embeddingType {
	case "openai", "api":
		if apiKey == "" {
			return nil, fmt.Errorf("EMBEDDING_API_KEY 未设置")
		}
		return NewOpenAIEmbeddingService(apiURL, apiKey, model), nil

	case "local", "bge":
		return NewBGEEmbeddingService(apiURL, apiKey, model), nil

	default:
		return nil, fmt.Errorf("不支持的嵌入服务类型: %s", embeddingType)
	}
}
