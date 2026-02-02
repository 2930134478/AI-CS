package import_service

import (
	"errors"
	"strings"
)

// PDFParser PDF 解析器
type PDFParser struct{}

// NewPDFParser 创建 PDF 解析器
func NewPDFParser() *PDFParser {
	return &PDFParser{}
}

// Supports 检查是否支持该文件
func (p *PDFParser) Supports(filePath string) bool {
	return strings.HasSuffix(strings.ToLower(filePath), ".pdf")
}

// Parse 解析 PDF 文件
// TODO: 需要集成专业库（如 pdfcpu/pdfcpu 或 gen2brain/go-fitz）
func (p *PDFParser) Parse(filePath string) (*ParsedDocument, error) {
	// TODO: 实现 PDF 解析逻辑
	return nil, errors.New("PDF 解析功能待实现，需要集成专业库")
}
