package import_service

import (
	"archive/zip"
	"encoding/xml"
	"fmt"
	"io"
	"path/filepath"
	"strings"
)

// WordParser Word 解析器（直接解析 .docx ZIP/XML）
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

// Parse 解析 Word 文件（.docx 是 ZIP 压缩的 XML）
func (p *WordParser) Parse(filePath string) (*ParsedDocument, error) {
	if strings.HasSuffix(strings.ToLower(filePath), ".doc") {
		return nil, fmt.Errorf("暂不支持旧版 .doc 格式，请转换为 .docx 后导入")
	}

	r, err := zip.OpenReader(filePath)
	if err != nil {
		return nil, fmt.Errorf("打开 Word 文档失败: %w", err)
	}
	defer r.Close()

	var docFile *zip.File
	for _, f := range r.File {
		if f.Name == "word/document.xml" {
			docFile = f
			break
		}
	}
	if docFile == nil {
		return nil, fmt.Errorf("Word 文档格式异常：找不到 word/document.xml")
	}

	rc, err := docFile.Open()
	if err != nil {
		return nil, fmt.Errorf("读取文档内容失败: %w", err)
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, fmt.Errorf("读取文档内容失败: %w", err)
	}

	var doc struct {
		Body struct {
			Paragraphs []struct {
				Runs []struct {
					Text string `xml:"t"`
				} `xml:"r"`
			} `xml:"p"`
		} `xml:"body"`
	}
	if err := xml.Unmarshal(data, &doc); err != nil {
		return nil, fmt.Errorf("解析文档 XML 失败: %w", err)
	}

	var paragraphs []string
	for _, p := range doc.Body.Paragraphs {
		var texts []string
		for _, run := range p.Runs {
			if strings.TrimSpace(run.Text) != "" {
				texts = append(texts, run.Text)
			}
		}
		line := strings.TrimSpace(strings.Join(texts, ""))
		if line != "" {
			paragraphs = append(paragraphs, line)
		}
	}

	if len(paragraphs) == 0 {
		return nil, fmt.Errorf("Word 文档中未提取到文本内容")
	}

	content := strings.Join(paragraphs, "\n\n")

	title := paragraphs[0]
	if len([]rune(title)) > 100 {
		title = string([]rune(title)[:100])
	}
	if len([]rune(paragraphs[0])) > 100 {
		title = strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))
	}

	return &ParsedDocument{
		Title:    title,
		Content:  content,
		Metadata: map[string]interface{}{"source": "word"},
	}, nil
}
