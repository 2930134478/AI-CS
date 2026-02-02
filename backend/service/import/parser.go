package import_service

// ParsedDocument 解析后的文档
type ParsedDocument struct {
	Title   string
	Content string
	Metadata map[string]interface{}
}

// DocumentParser 文档解析器接口
type DocumentParser interface {
	Parse(filePath string) (*ParsedDocument, error)
	Supports(filePath string) bool
}
