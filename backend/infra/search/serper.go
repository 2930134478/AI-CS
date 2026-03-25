package search

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	serperBaseURL  = "https://google.serper.dev/search"
	defaultTimeout = 15 * time.Second
)

// SerperProvider 使用 Serper API 的联网搜索实现（项目内直接调用，无需代理）。
type SerperProvider struct {
	apiKey string
	client *http.Client
}

// NewSerperProvider 创建 Serper 搜索提供方。apiKey 为空时 Search 返回空字符串与 nil error（调用方回退）。
func NewSerperProvider(apiKey string) *SerperProvider {
	return &SerperProvider{
		apiKey: strings.TrimSpace(apiKey),
		client: &http.Client{Timeout: defaultTimeout},
	}
}

// Search 执行搜索并返回格式化后的文本摘要，供 LLM 使用。未配置 apiKey 或请求失败时返回空字符串。
func (p *SerperProvider) Search(ctx context.Context, query string) (string, error) {
	if p.apiKey == "" {
		return "", nil
	}
	reqBody := map[string]interface{}{"q": query}
	bodyBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, serperBaseURL, strings.NewReader(string(bodyBytes)))
	if err != nil {
		return "", fmt.Errorf("serper request: %w", err)
	}
	req.Header.Set("X-API-KEY", p.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("serper http: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		bs, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("serper api %d: %s", resp.StatusCode, string(bs))
	}
	var result serperResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("serper decode: %w", err)
	}
	return result.FormatOrganic(), nil
}

type serperResponse struct {
	Organic []struct {
		Title   string `json:"title"`
		Link    string `json:"link"`
		Snippet string `json:"snippet"`
	} `json:"organic"`
}

func (r *serperResponse) FormatOrganic() string {
	if len(r.Organic) == 0 {
		return ""
	}
	var b strings.Builder
	for i, o := range r.Organic {
		if i > 0 {
			b.WriteString("\n\n")
		}
		b.WriteString(o.Title)
		b.WriteString("\n")
		b.WriteString(o.Link)
		b.WriteString("\n")
		b.WriteString(o.Snippet)
	}
	return b.String()
}
