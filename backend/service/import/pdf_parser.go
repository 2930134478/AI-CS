package import_service

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/ledongthuc/pdf"
)

// PDFParser PDF 解析器（纯 Go，使用 ledongthuc/pdf GetTextByRow 避免竖排）
type PDFParser struct{}

// NewPDFParser 创建 PDF 解析器
func NewPDFParser() *PDFParser {
	return &PDFParser{}
}

// Supports 检查是否支持该文件
func (p *PDFParser) Supports(filePath string) bool {
	return strings.HasSuffix(strings.ToLower(filePath), ".pdf")
}

// Parse 解析 PDF 文件（使用 GetTextByRow 按行分组，避免字符竖排）
func (p *PDFParser) Parse(filePath string) (*ParsedDocument, error) {
	f, reader, err := pdf.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("打开 PDF 失败: %w", err)
	}
	defer f.Close()

	var allLines []string

	for pageNum := 1; pageNum <= reader.NumPage(); pageNum++ {
		page := reader.Page(pageNum)
		if page.V.IsNull() {
			continue
		}

		rows, err := page.GetTextByRow()
		if err != nil {
			continue
		}

		for _, row := range rows {
			var sb strings.Builder
			for _, t := range row.Content {
				sb.WriteString(t.S)
			}
			line := strings.TrimSpace(sb.String())
			if line != "" {
				allLines = append(allLines, line)
			}
		}
	}

	text := strings.Join(allLines, "\n")
	if strings.TrimSpace(text) == "" {
		return nil, fmt.Errorf("PDF 文件中未提取到文本内容")
	}

	title := strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))

	return &ParsedDocument{
		Title:    title,
		Content:  text,
		Metadata: map[string]interface{}{"source": "pdf"},
	}, nil
}
