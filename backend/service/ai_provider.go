package service

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// AIProvider AI 服务提供商接口（可扩展设计）
// 不同的 AI 服务提供商需要实现这个接口
type AIProvider interface {
	// GenerateResponse 生成 AI 回复
	// imageBase64、imageMimeType 非空时表示当前用户消息带一张图（多模态识图），将与本条文本一起作为 user 消息发送
	GenerateResponse(conversationHistory []MessageHistory, userMessage string, imageBase64 string, imageMimeType string) (string, error)
	// GenerateResponseWithTools 带工具调用的生成；messages 与 tools 为 OpenAI 格式。返回 content、tool_calls、error。
	// 若某实现不支持，可返回 ( "", nil, err ) 或仅返回 content。
	GenerateResponseWithTools(messages []map[string]interface{}, tools []map[string]interface{}) (content string, toolCalls []ToolCall, err error)
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

// ToolCall 模型返回的工具调用（OpenAI 格式）
type ToolCall struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Arguments string `json:"arguments"` // JSON 字符串
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
	config  AIConfig
	client  *http.Client
	adapter *AdapterConfig
}

// NewUniversalAIProvider 创建通用 AI 提供商实例。
func NewUniversalAIProvider(config AIConfig) *UniversalAIProvider {
	// 设置默认适配器配置
	adapter := config.AdapterConfig
	if adapter == nil {
		adapter = &AdapterConfig{
			AuthHeader:   "Bearer",                     // 默认使用 Bearer Token
			ResponsePath: "choices[0].message.content", // 默认 OpenAI 格式
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
		config: config,
		client: &http.Client{
			Timeout: 60 * time.Second, // 60 秒超时
		},
		adapter: adapter,
	}
}

// isResponsesAPI 判断是否为 OpenAI Responses API（/v1/responses），请求/响应格式与 Chat Completions 不同。
func isResponsesAPI(apiURL string) bool {
	return strings.Contains(apiURL, "/v1/responses")
}

// GenerateResponse 生成 AI 回复（支持 OpenAI 兼容格式，通过适配器适配不同服务商）。
func (p *UniversalAIProvider) GenerateResponse(conversationHistory []MessageHistory, userMessage string, imageBase64 string, imageMimeType string) (string, error) {
	switch p.config.ModelType {
	case "text":
		return p.generateTextResponse(conversationHistory, userMessage, imageBase64, imageMimeType)
	case "image":
		return "", fmt.Errorf("图片模型请使用生图接口")
	case "audio":
		return "", fmt.Errorf("语音模型暂未支持")
	case "video":
		return "", fmt.Errorf("视频模型暂未支持")
	default:
		return "", fmt.Errorf("不支持的模型类型: %s", p.config.ModelType)
	}
}

// buildUserContent 构建当前用户消息的 content：纯文本或 text+image（多模态）
func buildUserContent(userMessage string, imageBase64 string, imageMimeType string) interface{} {
	if imageBase64 == "" {
		return userMessage
	}
	// OpenAI 多模态：content 为数组，text + image_url（data URL）
	dataURL := "data:" + imageMimeType + ";base64," + imageBase64
	if imageMimeType == "" {
		dataURL = "data:image/jpeg;base64," + imageBase64
	}
	parts := []map[string]interface{}{
		{"type": "text", "text": userMessage},
		{"type": "image_url", "image_url": map[string]string{"url": dataURL}},
	}
	return parts
}

// generateTextResponse 生成文本回复（支持多模态：当前用户消息可带图）。
func (p *UniversalAIProvider) generateTextResponse(conversationHistory []MessageHistory, userMessage string, imageBase64 string, imageMimeType string) (string, error) {
	// 使用 interface{} 以支持最后一条 user 消息的 content 为数组（多模态）
	messages := make([]map[string]interface{}, 0)
	for _, history := range conversationHistory {
		messages = append(messages, map[string]interface{}{"role": history.Role, "content": history.Content})
	}
	lastContent := buildUserContent(userMessage, imageBase64, imageMimeType)
	messages = append(messages, map[string]interface{}{"role": "user", "content": lastContent})

	var requestBody map[string]interface{}
	if isResponsesAPI(p.config.APIURL) {
		requestBody = map[string]interface{}{
			"model":  p.config.Model,
			"input":  messages,
			"stream": false,
		}
	} else {
		requestBody = map[string]interface{}{
			"model":    p.config.Model,
			"messages": messages,
		}
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

	// 发送请求（若发生重定向，req.URL 会被 Client 更新为最终 URL；失败日志便于与配置里的 api_url 对照）
	resp, err := p.client.Do(req)
	if err != nil {
		log.Printf("⚠️ AI generateTextResponse 请求失败: config.api_url=%s 实际 req.URL=%s err=%v",
			p.config.APIURL, req.URL.String(), err)
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

// GenerateResponseWithTools 带工具调用的生成（OpenAI 兼容：tools + tool_calls）。
// messages 为 OpenAI 格式消息数组（可含 role, content, tool_calls, tool_call_id 等）。
// tools 为工具定义数组（如 [{"type":"function","function":{...}}] 或 [{"type":"web_search"}]）。
// 返回 content、tool_calls（若有）、error。
func (p *UniversalAIProvider) GenerateResponseWithTools(messages []map[string]interface{}, tools []map[string]interface{}) (content string, toolCalls []ToolCall, err error) {
	if p.config.ModelType != "text" {
		return "", nil, fmt.Errorf("带工具调用仅支持 text 模型")
	}
	var requestBody map[string]interface{}
	if isResponsesAPI(p.config.APIURL) {
		requestBody = map[string]interface{}{
			"model":       p.config.Model,
			"input":       messages,
			"stream":      false,
			"tool_choice": "auto",
		}
		if len(tools) > 0 {
			requestBody["tools"] = tools
		}
	} else {
		requestBody = map[string]interface{}{
			"model":    p.config.Model,
			"messages": messages,
		}
		if len(tools) > 0 {
			requestBody["tools"] = tools
		}
	}
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", nil, fmt.Errorf("序列化请求失败: %v", err)
	}
	req, err := http.NewRequest("POST", p.config.APIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", nil, fmt.Errorf("创建请求失败: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	authValue := p.config.APIKey
	if p.adapter.AuthHeader == "Bearer" {
		authValue = "Bearer " + p.config.APIKey
		req.Header.Set("Authorization", authValue)
	} else if p.adapter.AuthHeader == "X-API-Key" {
		req.Header.Set("X-API-Key", p.config.APIKey)
	} else {
		req.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	}
	resp, err := p.client.Do(req)
	if err != nil {
		log.Printf("⚠️ AI GenerateResponseWithTools 请求失败: config.api_url=%s 实际 req.URL=%s err=%v",
			p.config.APIURL, req.URL.String(), err)
		return "", nil, fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, fmt.Errorf("读取响应失败: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", nil, fmt.Errorf("API 返回错误: %s (状态码: %d)", string(body), resp.StatusCode)
	}
	var responseData map[string]interface{}
	if err := json.Unmarshal(body, &responseData); err != nil {
		return "", nil, fmt.Errorf("解析响应失败: %v", err)
	}
	if errorMsg, ok := responseData["error"].(map[string]interface{}); ok {
		if msg, ok := errorMsg["message"].(string); ok {
			return "", nil, fmt.Errorf("API 错误: %s", msg)
		}
	}
	content, toolCalls = p.extractContentAndToolCalls(responseData)
	return content, toolCalls, nil
}

// extractContentAndToolCalls 从响应中提取 content 与 tool_calls
// 支持 Chat Completions（choices[0].message）与 Responses API（output[]）
func (p *UniversalAIProvider) extractContentAndToolCalls(data map[string]interface{}) (content string, toolCalls []ToolCall) {
	// Responses API：output 数组内 message 的 content 含 output_text 与 tool_use
	if output, ok := data["output"].([]interface{}); ok {
		var textParts []string
		for _, item := range output {
			obj, _ := item.(map[string]interface{})
			if obj == nil || getStr(obj, "type") != "message" {
				continue
			}
			contentParts, _ := obj["content"].([]interface{})
			for _, part := range contentParts {
				pm, _ := part.(map[string]interface{})
				if pm == nil {
					continue
				}
				switch getStr(pm, "type") {
				case "output_text":
					if t, ok := pm["text"].(string); ok && t != "" {
						textParts = append(textParts, t)
					}
				case "tool_use":
					args := getStr(pm, "input")
					if args == "" {
						args = "{}"
					}
					toolCalls = append(toolCalls, ToolCall{
						ID:        getStr(pm, "id"),
						Name:      getStr(pm, "name"),
						Arguments: args,
					})
				}
			}
		}
		if len(textParts) > 0 {
			content = strings.Join(textParts, "")
		}
		return content, toolCalls
	}

	// Chat Completions 格式
	choices, _ := data["choices"].([]interface{})
	if len(choices) == 0 {
		return "", nil
	}
	choice, _ := choices[0].(map[string]interface{})
	message, _ := choice["message"].(map[string]interface{})
	if message != nil {
		if c, ok := message["content"].(string); ok {
			content = c
		}
		tcList, _ := message["tool_calls"].([]interface{})
		for _, t := range tcList {
			tm, _ := t.(map[string]interface{})
			fn, _ := tm["function"].(map[string]interface{})
			args := ""
			if fn != nil {
				if a, ok := fn["arguments"].(string); ok {
					args = a
				}
			}
			toolCalls = append(toolCalls, ToolCall{
				ID:        getStr(tm, "id"),
				Name:      getStr(fn, "name"),
				Arguments: args,
			})
		}
	}
	return content, toolCalls
}

func getStr(m map[string]interface{}, key string) string {
	if m == nil {
		return ""
	}
	v, _ := m[key].(string)
	return v
}

// extractResponseContent 根据响应路径提取内容（支持灵活的路径配置）。
// 例如："choices[0].message.content"（Chat Completions）或 Responses API 的 output[].content[].text
func (p *UniversalAIProvider) extractResponseContent(data map[string]interface{}, path string) (string, error) {
	// Responses API：output 数组内 message 的 content 中 output_text 的 text
	if output, ok := data["output"].([]interface{}); ok && len(output) > 0 {
		for _, item := range output {
			obj, _ := item.(map[string]interface{})
			if obj == nil {
				continue
			}
			if getStr(obj, "type") != "message" {
				continue
			}
			contentParts, _ := obj["content"].([]interface{})
			var textParts []string
			for _, part := range contentParts {
				pm, _ := part.(map[string]interface{})
				if pm == nil {
					continue
				}
				if getStr(pm, "type") == "output_text" {
					if t, ok := pm["text"].(string); ok && t != "" {
						textParts = append(textParts, t)
					}
				}
			}
			if len(textParts) > 0 {
				return strings.Join(textParts, ""), nil
			}
		}
		return "", errors.New("Responses API 的 output 中未找到 message 文本")
	}

	// 默认路径：choices[0].message.content（OpenAI Chat Completions 格式）
	if path == "" || path == "choices[0].message.content" {
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

// ImageGenerationProvider 生图接口（用于 chat_mode=image 渠道）
type ImageGenerationProvider interface {
	// GenerateImage 根据文本描述生成图片，返回图片二进制与 MIME 类型
	GenerateImage(prompt string) (imageData []byte, mimeType string, err error)
}

// CreateProvider 根据配置创建对应的 AI 提供商。
func (f *AIProviderFactory) CreateProvider(config AIConfig) (AIProvider, error) {
	return NewUniversalAIProvider(config), nil
}

// isPoixeGeminiImageAPI 判断是否为 Poixe 的 Google Gemini Content 生图接口（需 x-goog-api-key 且请求/响应格式不同）
func isPoixeGeminiImageAPI(apiURL string) bool {
	lower := strings.ToLower(apiURL)
	return (strings.Contains(lower, "poixe.com") && strings.Contains(lower, "generatecontent")) ||
		(strings.Contains(lower, "poixe.com") && strings.Contains(lower, "v1beta"))
}

// GenerateImage 实现生图（model_type=image 的配置使用）。支持 OpenAI Images 与 Poixe Nano Banana（Gemini Content）两种协议。
func (p *UniversalAIProvider) GenerateImage(prompt string) (imageData []byte, mimeType string, err error) {
	if p.config.ModelType != "image" {
		return nil, "", fmt.Errorf("当前配置不是生图模型，model_type=%s", p.config.ModelType)
	}
	useGemini := isPoixeGeminiImageAPI(p.config.APIURL)
	var jsonData []byte
	if useGemini {
		// Poixe Nano Banana：Google Gemini Content 协议，见 https://docs.poixe.com/cn/docs/models-pricing/nano-banana
		body := map[string]interface{}{
			"contents": []map[string]interface{}{
				{"parts": []map[string]interface{}{{"text": prompt}}},
			},
			"generationConfig": map[string]interface{}{
				"responseModalities": []string{"Text", "Image"},
				"imageConfig": map[string]interface{}{
					"aspectRatio": "1:1",
					"imageSize":   "1K",
				},
			},
		}
		jsonData, err = json.Marshal(body)
		if err != nil {
			return nil, "", err
		}
	} else {
		// OpenAI 兼容：/v1/images/generations
		body := map[string]interface{}{
			"model":  p.config.Model,
			"prompt": prompt,
			"n":      1,
		}
		if strings.Contains(strings.ToLower(p.config.APIURL), "images") {
			body["response_format"] = "b64_json"
			body["size"] = "1024x1024"
		}
		jsonData, err = json.Marshal(body)
		if err != nil {
			return nil, "", err
		}
	}
	req, err := http.NewRequest("POST", p.config.APIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("Content-Type", "application/json")
	// Poixe Gemini Content 要求 x-goog-api-key；适配器可显式指定，或按 URL 自动识别
	useGoogKey := (p.adapter != nil && strings.ToLower(p.adapter.AuthHeader) == "x-goog-api-key") || useGemini
	if useGoogKey {
		req.Header.Set("x-goog-api-key", p.config.APIKey)
	} else if p.adapter != nil && p.adapter.AuthHeader == "X-API-Key" {
		req.Header.Set("X-API-Key", p.config.APIKey)
	} else {
		req.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	}
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("生图 API 错误: %s (状态码: %d)", string(data), resp.StatusCode)
	}
	if useGemini {
		return p.parseGeminiImageResponse(data)
	}
	return p.parseOpenAIImageResponse(data)
}

// parseGeminiImageResponse 解析 Poixe/Gemini Content 生图响应：candidates[0].content.parts 中的 inlineData
func (p *UniversalAIProvider) parseGeminiImageResponse(data []byte) (imageData []byte, mimeType string, err error) {
	var parsed struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					InlineData *struct {
						MimeType string `json:"mimeType"`
						Data     string `json:"data"`
					} `json:"inlineData"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, "", fmt.Errorf("解析 Gemini 生图响应失败: %w", err)
	}
	if len(parsed.Candidates) == 0 {
		return nil, "", errors.New("Gemini 生图未返回 candidates")
	}
	for _, part := range parsed.Candidates[0].Content.Parts {
		if part.InlineData != nil && part.InlineData.Data != "" {
			decoded, err := base64.StdEncoding.DecodeString(part.InlineData.Data)
			if err != nil {
				return nil, "", fmt.Errorf("base64 解码失败: %w", err)
			}
			mt := part.InlineData.MimeType
			if mt == "" {
				mt = "image/png"
			}
			return decoded, mt, nil
		}
	}
	return nil, "", errors.New("Gemini 生图响应中无 inlineData")
}

// parseOpenAIImageResponse 解析 OpenAI 风格生图响应：data[0].b64_json 或 data[0].url
func (p *UniversalAIProvider) parseOpenAIImageResponse(data []byte) (imageData []byte, mimeType string, err error) {
	var parsed struct {
		Data []struct {
			B64JSON *string `json:"b64_json"`
			URL     string  `json:"url"`
		} `json:"data"`
	}
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, "", fmt.Errorf("解析生图响应失败: %w", err)
	}
	if len(parsed.Data) == 0 {
		return nil, "", errors.New("生图 API 未返回图片")
	}
	first := parsed.Data[0]
	if first.B64JSON != nil && *first.B64JSON != "" {
		decoded, err := base64.StdEncoding.DecodeString(*first.B64JSON)
		if err != nil {
			return nil, "", fmt.Errorf("base64 解码失败: %w", err)
		}
		return decoded, "image/png", nil
	}
	if first.URL != "" {
		getResp, err := http.Get(first.URL)
		if err != nil {
			return nil, "", fmt.Errorf("下载生成图片失败: %w", err)
		}
		defer getResp.Body.Close()
		decoded, err := io.ReadAll(getResp.Body)
		if err != nil {
			return nil, "", err
		}
		return decoded, "image/png", nil
	}
	return nil, "", errors.New("生图响应中无 b64_json 或 url")
}
