package import_service

import (
	"errors"
	"strings"
)

// WordParser Word 解析器
type WordParser struct{}

// NewWordParser 创建 Word 解析器
func NewWordParser() *WordParser {
	return &WordParser{}
}

// Supports 检查是否支持该文件
func (p *WordParser) Supports(filePath string) bool {
	return strings.HasSuffix(strings.ToLower(filePath), ".docx") ||
		strings.HasSuffix(strings.ToLower(filePath), ".doc")
}

// Parse 解析 Word 文件
// TODO: 需要集成专业库（如 unidoc/unioffice 或 lukasjarosch/go-docx）
func (p *WordParser) Parse(filePath string) (*ParsedDocument, error) {
	// TODO: 实现 Word 解析逻辑
	return nil, errors.New("Word 解析功能待实现，需要集成专业库")
}
