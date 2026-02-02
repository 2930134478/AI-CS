package import_service

import (
	"os"
	"strings"
)

// MarkdownParser Markdown 解析器
type MarkdownParser struct{}

// NewMarkdownParser 创建 Markdown 解析器
func NewMarkdownParser() *MarkdownParser {
	return &MarkdownParser{}
}

// Supports 检查是否支持该文件
func (p *MarkdownParser) Supports(filePath string) bool {
	return strings.HasSuffix(strings.ToLower(filePath), ".md") ||
		strings.HasSuffix(strings.ToLower(filePath), ".markdown")
}

// Parse 解析 Markdown 文件
func (p *MarkdownParser) Parse(filePath string) (*ParsedDocument, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	// 提取标题（第一行作为标题）
	lines := strings.Split(string(content), "\n")
	title := ""
	body := string(content)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			// 移除 Markdown 标题标记
			title = strings.TrimPrefix(line, "#")
			title = strings.TrimPrefix(title, "##")
			title = strings.TrimPrefix(title, "###")
			title = strings.TrimSpace(title)
			break
		}
	}

	if title == "" {
		title = filePath
	}

	return &ParsedDocument{
		Title:    title,
		Content:  body,
		Metadata: make(map[string]interface{}),
	}, nil
}
