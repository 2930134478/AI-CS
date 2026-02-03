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

// BGEEmbeddingService BGE 嵌入服务实现
type BGEEmbeddingService struct {
	apiURL string
	apiKey string
	model  string
	dimension int
}

// NewBGEEmbeddingService 创建 BGE 嵌入服务实例
func NewBGEEmbeddingService(apiURL, apiKey, model string) *BGEEmbeddingService {
	if apiURL == "" {
		apiURL = "http://localhost:8080"
	}
	if model == "" {
		model = "bge-small-zh-v1.5"
	}
	
	return &BGEEmbeddingService{
		apiURL: apiURL,
		apiKey: apiKey,
		model:  model,
		dimension: 512, // BGE 模型的默认维度
	}
}

// EmbedText 向量化单个文本
func (s *BGEEmbeddingService) EmbedText(ctx context.Context, text string) ([]float32, error) {
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
func (s *BGEEmbeddingService) EmbedTexts(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	// 诊断日志：确认发请求前我们到底发了几条文本
	log.Printf("[嵌入] BGE EmbedTexts 请求: len(texts)=%d, model=%s, apiURL=%s", len(texts), s.model, strings.TrimSuffix(s.apiURL, "/"))
	for i, t := range texts {
		runeLen := len([]rune(t))
		preview := t
		if runeLen > 60 {
			preview = string([]rune(t)[:60]) + "..."
		}
		log.Printf("[嵌入]   texts[%d] 长度=%d 字符, 预览: %q", i, runeLen, preview)
	}

	// 支持填完整路径或仅填 base：若已以 /embeddings 结尾则不再追加，否则追加 /embeddings
	url := strings.TrimSuffix(s.apiURL, "/")
	if url != "" && !strings.HasSuffix(strings.ToLower(url), "/embeddings") {
		url = url + "/embeddings"
	} else if url == "" {
		url = s.apiURL + "/embeddings"
	}

	// 构建请求体（兼容 HuggingFace Inference API 格式）
	requestBody := map[string]interface{}{
		"inputs": texts,
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
	if s.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+s.apiKey)
	}

	// 发送请求
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("BGE 嵌入服务调用失败: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("BGE 嵌入服务调用失败: HuggingFace API 返回错误状态码 %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应（HuggingFace Inference API 格式）；若返回 HTML 则提示检查 API 地址/密钥
	var response [][]float64
	if err := json.Unmarshal(body, &response); err != nil {
		if len(body) > 0 && body[0] == '<' {
			snippet := string(body)
			if len(snippet) > 200 {
				snippet = snippet[:200] + "..."
			}
			log.Printf("[嵌入] BGE 返回了 HTML 而非 JSON，请检查 API 地址与密钥。响应片段: %s", snippet)
			return nil, fmt.Errorf("嵌入 API 返回了 HTML 而非 JSON，请检查「设置 - 知识库向量模型」中的 API 地址与密钥: %w", err)
		}
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 诊断日志：API 实际返回了几个向量
	numIn := len(texts)
	numOut := len(response)
	log.Printf("[嵌入] BGE EmbedTexts 响应: len(texts)=%d -> len(response)=%d (API 返回向量数)", numIn, numOut)
	if numOut != numIn {
		log.Printf("[嵌入] 数量不一致: 我们发了 %d 条文本，API 返回了 %d 个向量", numIn, numOut)
	}

	// 转换为 float32
	result := make([][]float32, len(response))
	for i, item := range response {
		result[i] = make([]float32, len(item))
		for j, v := range item {
			result[i][j] = float32(v)
		}
	}

	return result, nil
}

// GetDimension 获取向量维度
func (s *BGEEmbeddingService) GetDimension() int {
	return s.dimension
}

// GetModelName 获取模型名称
func (s *BGEEmbeddingService) GetModelName() string {
	return s.model
}
