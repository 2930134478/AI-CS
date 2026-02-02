package import_service

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// URLParser URL 解析器
type URLParser struct {
	client *http.Client
}

// NewURLParser 创建 URL 解析器
func NewURLParser() *URLParser {
	return &URLParser{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Supports 检查是否支持该 URL
func (p *URLParser) Supports(url string) bool {
	return strings.HasPrefix(strings.ToLower(url), "http://") ||
		strings.HasPrefix(strings.ToLower(url), "https://")
}

// Parse 解析 URL
func (p *URLParser) Parse(url string) (*ParsedDocument, error) {
	// 下载网页
	resp, err := p.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("下载网页失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("下载网页失败: HTTP %d", resp.StatusCode)
	}

	// 解析 HTML
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("解析 HTML 失败: %w", err)
	}

	// 提取标题
	title := doc.Find("title").First().Text()
	if title == "" {
		title = doc.Find("h1").First().Text()
	}
	if title == "" {
		title = url
	}

	// 提取正文内容
	var content strings.Builder
	doc.Find("body").Each(func(i int, s *goquery.Selection) {
		// 移除脚本和样式
		s.Find("script, style").Remove()
		// 提取文本
		text := s.Text()
		content.WriteString(text)
		content.WriteString("\n")
	})

	body := content.String()
	if body == "" {
		// 如果 body 为空，尝试重新下载
		if body == "" {
			resp2, err := p.client.Get(url)
			if err == nil {
				defer resp2.Body.Close()
				bodyBytes, _ := io.ReadAll(resp2.Body)
				body = string(bodyBytes)
			}
		}
	}

	return &ParsedDocument{
		Title:    strings.TrimSpace(title),
		Content:  strings.TrimSpace(body),
		Metadata: map[string]interface{}{
			"url": url,
		},
	}, nil
}
