package embedding

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// OpenAIEmbeddingService OpenAI 嵌入服务实现
type OpenAIEmbeddingService struct {
	apiURL string
	apiKey string
	model  string
	dimension int
}

// NewOpenAIEmbeddingService 创建 OpenAI 嵌入服务实例
func NewOpenAIEmbeddingService(apiURL, apiKey, model string) *OpenAIEmbeddingService {
	if apiURL == "" {
		apiURL = "https://api.openai.com/v1"
	}
	if model == "" {
		model = "text-embedding-3-small"
	}
	
	dimension := 1536 // text-embedding-3-small 的默认维度
	if model == "text-embedding-3-large" {
		dimension = 3072
	}
	
	return &OpenAIEmbeddingService{
		apiURL: apiURL,
		apiKey: apiKey,
		model:  model,
		dimension: dimension,
	}
}

// EmbedText 向量化单个文本
func (s *OpenAIEmbeddingService) EmbedText(ctx context.Context, text string) ([]float32, error) {
	vectors, err := s.EmbedTexts(ctx, []string{text})
	if err != nil {
		return nil, err
	}
	if len(vectors) == 0 {
		return nil, fmt.Errorf("未返回向量")
	}
	return vectors[0], nil
}

// EmbedTexts 批量向量化文本
func (s *OpenAIEmbeddingService) EmbedTexts(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	// 支持填完整路径或仅填 base：若已以 /embeddings 结尾则不再追加，否则追加 /embeddings
	url := strings.TrimSuffix(s.apiURL, "/")
	if url != "" && !strings.HasSuffix(strings.ToLower(url), "/embeddings") {
		url = url + "/embeddings"
	} else if url == "" {
		url = s.apiURL + "/embeddings"
	}

	// 构建请求体
	requestBody := map[string]interface{}{
		"input": texts,
		"model": s.model,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	// 创建 HTTP 请求
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	// 发送请求
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenAI API 返回错误状态码 %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应（若返回 HTML 则提示检查 API 地址/密钥）
	var response struct {
		Data []struct {
			Embedding []float64 `json:"embedding"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		if len(body) > 0 && body[0] == '<' {
			snippet := string(body)
			if len(snippet) > 200 {
				snippet = snippet[:200] + "..."
			}
			log.Printf("[嵌入] OpenAI 返回了 HTML 而非 JSON，请检查 API 地址与密钥。响应片段: %s", snippet)
			return nil, fmt.Errorf("嵌入 API 返回了 HTML 而非 JSON，请检查「设置 - 知识库向量模型」中的 API 地址与密钥: %w", err)
		}
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 转换为 float32
	result := make([][]float32, len(response.Data))
	for i, item := range response.Data {
		result[i] = make([]float32, len(item.Embedding))
		for j, v := range item.Embedding {
			result[i][j] = float32(v)
		}
	}

	return result, nil
}

// GetDimension 获取向量维度
func (s *OpenAIEmbeddingService) GetDimension() int {
	return s.dimension
}

// GetModelName 获取模型名称
func (s *OpenAIEmbeddingService) GetModelName() string {
	return s.model
}
