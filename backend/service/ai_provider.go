package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

// AIProvider AI 服务提供商接口（可扩展设计）
// 不同的 AI 服务提供商需要实现这个接口
type AIProvider interface {
	// GenerateResponse 生成 AI 回复
	// conversationHistory: 对话历史（用于上下文）
	// userMessage: 用户当前消息
	// 返回: AI 回复内容
	GenerateResponse(conversationHistory []MessageHistory, userMessage string) (string, error)
}

// AdapterConfig 适配器配置（用于适配不同服务商的 API 格式差异）
type AdapterConfig struct {
	// 认证头格式（默认：Bearer）
	AuthHeader string `json:"auth_header"` // 例如："Bearer"、"X-API-Key"、"Authorization"
	// 响应解析路径（默认：choices[0].message.content）
	ResponsePath string `json:"response_path"` // 例如："choices[0].message.content"、"data.text"、"result.content"
	// 请求格式自定义（可选）
	RequestFormat map[string]interface{} `json:"request_format"` // 用于覆盖默认的请求格式
}

// MessageHistory 对话历史记录
type MessageHistory struct {
	Role    string `json:"role"`    // "user" 或 "assistant"
	Content string `json:"content"` // 消息内容
}

// AIConfig 用于 AI 调用的配置信息
type AIConfig struct {
	APIURL        string
	APIKey        string
	Model         string
	ModelType     string
	Provider      string
	AdapterConfig *AdapterConfig // 适配器配置（用于适配不同服务商的差异）
}

// UniversalAIProvider 通用 AI 服务提供商（支持所有 OpenAI 兼容格式）
// 通过适配器配置来适配不同服务商的细微差异
// 这样 90% 的服务商都可以用同一个 Provider，无需单独实现
type UniversalAIProvider struct {
	config AIConfig
	client *http.Client
	adapter *AdapterConfig
}

// NewUniversalAIProvider 创建通用 AI 提供商实例。
func NewUniversalAIProvider(config AIConfig) *UniversalAIProvider {
	// 设置默认适配器配置
	adapter := config.AdapterConfig
	if adapter == nil {
		adapter = &AdapterConfig{
			AuthHeader:  "Bearer",                          // 默认使用 Bearer Token
			ResponsePath: "choices[0].message.content",     // 默认 OpenAI 格式
		}
	} else {
		// 设置默认值
		if adapter.AuthHeader == "" {
			adapter.AuthHeader = "Bearer"
		}
		if adapter.ResponsePath == "" {
			adapter.ResponsePath = "choices[0].message.content"
		}
	}

	return &UniversalAIProvider{
		config:  config,
		client: &http.Client{
			Timeout: 30 * time.Second, // 30 秒超时
		},
		adapter: adapter,
	}
}

// GenerateResponse 生成 AI 回复（支持 OpenAI 兼容格式，通过适配器适配不同服务商）。
func (p *UniversalAIProvider) GenerateResponse(conversationHistory []MessageHistory, userMessage string) (string, error) {
	// 根据模型类型选择不同的处理逻辑
	switch p.config.ModelType {
	case "text":
		return p.generateTextResponse(conversationHistory, userMessage)
	case "image":
		// 图片生成（未来扩展）
		return "", fmt.Errorf("图片模型暂未支持")
	case "audio":
		// 语音识别/合成（未来扩展）
		return "", fmt.Errorf("语音模型暂未支持")
	case "video":
		// 视频生成（未来扩展）
		return "", fmt.Errorf("视频模型暂未支持")
	default:
		return "", fmt.Errorf("不支持的模型类型: %s", p.config.ModelType)
	}
}

// generateTextResponse 生成文本回复（通用实现，支持所有 OpenAI 兼容格式）。
func (p *UniversalAIProvider) generateTextResponse(conversationHistory []MessageHistory, userMessage string) (string, error) {
	// 构建消息列表（包含历史对话和当前消息）
	messages := make([]map[string]string, 0)

	// 添加历史对话
	for _, history := range conversationHistory {
		messages = append(messages, map[string]string{
			"role":    history.Role,
			"content": history.Content,
		})
	}

	// 添加当前用户消息
	messages = append(messages, map[string]string{
		"role":    "user",
		"content": userMessage,
	})

	// 构建请求体（OpenAI 兼容格式）
	requestBody := map[string]interface{}{
		"model":    p.config.Model,
		"messages": messages,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("序列化请求失败: %v", err)
	}

	// 创建 HTTP 请求
	req, err := http.NewRequest("POST", p.config.APIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %v", err)
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	
	// 根据适配器配置设置认证头
	authValue := p.config.APIKey
	if p.adapter.AuthHeader == "Bearer" {
		authValue = "Bearer " + p.config.APIKey
		req.Header.Set("Authorization", authValue)
	} else if p.adapter.AuthHeader == "X-API-Key" {
		req.Header.Set("X-API-Key", p.config.APIKey)
	} else {
		// 默认使用 Authorization: Bearer
		req.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	}

	// 发送请求
	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %v", err)
	}

	// 检查 HTTP 状态码
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API 返回错误: %s (状态码: %d)", string(body), resp.StatusCode)
	}

	// 解析响应（支持灵活的响应路径）
	var responseData map[string]interface{}
	if err := json.Unmarshal(body, &responseData); err != nil {
		return "", fmt.Errorf("解析响应失败: %v", err)
	}

	// 检查是否有错误字段
	if errorMsg, ok := responseData["error"].(map[string]interface{}); ok {
		if msg, ok := errorMsg["message"].(string); ok {
			return "", fmt.Errorf("API 错误: %s", msg)
		}
	}

	// 根据适配器配置的响应路径提取内容
	content, err := p.extractResponseContent(responseData, p.adapter.ResponsePath)
	if err != nil {
		return "", err
	}

	if content == "" {
		return "", errors.New("API 返回空内容")
	}

	return content, nil
}

// extractResponseContent 根据响应路径提取内容（支持灵活的路径配置）。
// 例如："choices[0].message.content" 或 "data.text" 或 "result.content"
func (p *UniversalAIProvider) extractResponseContent(data map[string]interface{}, path string) (string, error) {
	// 默认路径：choices[0].message.content（OpenAI 格式）
	if path == "" || path == "choices[0].message.content" {
		// 尝试 OpenAI 格式
		if choices, ok := data["choices"].([]interface{}); ok && len(choices) > 0 {
			if choice, ok := choices[0].(map[string]interface{}); ok {
				if message, ok := choice["message"].(map[string]interface{}); ok {
					if content, ok := message["content"].(string); ok {
						return content, nil
					}
				}
			}
		}
	}

	// 尝试其他常见格式
	// 格式1: data.text
	if dataObj, ok := data["data"].(map[string]interface{}); ok {
		if text, ok := dataObj["text"].(string); ok {
			return text, nil
		}
	}

	// 格式2: result.content
	if result, ok := data["result"].(map[string]interface{}); ok {
		if content, ok := result["content"].(string); ok {
			return content, nil
		}
	}

	// 格式3: content（直接字段）
	if content, ok := data["content"].(string); ok {
		return content, nil
	}

	// 格式4: text（直接字段）
	if text, ok := data["text"].(string); ok {
		return text, nil
	}

	return "", errors.New("无法从响应中提取内容，请检查响应格式或配置适配器")
}

// AIProviderFactory AI 提供商工厂（用于创建不同类型的提供商）
type AIProviderFactory struct{}

// NewAIProviderFactory 创建 AI 提供商工厂实例。
func NewAIProviderFactory() *AIProviderFactory {
	return &AIProviderFactory{}
}

// CreateProvider 根据配置创建对应的 AI 提供商。
// 设计理念：
// 所有主流 AI 服务商都使用 REST API（HTTP/HTTPS），统一使用 UniversalAIProvider 处理
// 通过 AdapterConfig 适配不同服务商的细微差异（认证头、响应路径等）
func (f *AIProviderFactory) CreateProvider(config AIConfig) (AIProvider, error) {
	// 所有服务商都使用 REST API，统一处理
	return NewUniversalAIProvider(config), nil
}

