package service

import (
	"context"
	"log"

	"github.com/2930134478/AI-CS/backend/service/embedding"
)

// ConfigBackedEmbeddingProvider 基于 DB 配置的嵌入服务提供者，每次 Get 从配置读取，保存即生效
type ConfigBackedEmbeddingProvider struct {
	configService *EmbeddingConfigService
	factory       *embedding.EmbeddingFactory
}

// NewConfigBackedEmbeddingProvider 创建基于 DB 配置的嵌入服务提供者
func NewConfigBackedEmbeddingProvider(configService *EmbeddingConfigService, factory *embedding.EmbeddingFactory) *ConfigBackedEmbeddingProvider {
	return &ConfigBackedEmbeddingProvider{
		configService: configService,
		factory:       factory,
	}
}

// Get 返回当前配置对应的嵌入服务（每次从 DB 读取，无缓存）
func (p *ConfigBackedEmbeddingProvider) Get(ctx context.Context) (embedding.EmbeddingService, error) {
	typ, apiURL, apiKey, model, err := p.configService.GetRaw()
	if err != nil {
		return nil, err
	}
	if apiKey != "" {
		switch typ {
		case "openai", "api":
			return embedding.NewOpenAIEmbeddingService(apiURL, apiKey, model), nil
		case "local", "bge":
			return embedding.NewBGEEmbeddingService(apiURL, apiKey, model), nil
		default:
			svc, createErr := p.factory.CreateEmbeddingService(typ)
			if createErr != nil {
				log.Printf("⚠️ 从 DB 创建嵌入服务失败 (%s)，回退到环境变量: %v", typ, createErr)
				return p.fallbackFromEnv()
			}
			return svc, nil
		}
	}
	return p.fallbackFromEnv()
}

func (p *ConfigBackedEmbeddingProvider) fallbackFromEnv() (embedding.EmbeddingService, error) {
	svc, err := p.factory.CreateDefaultEmbeddingService()
	if err != nil {
		return embedding.NewUnconfiguredEmbeddingService(), nil
	}
	return svc, nil
}
