package rag

// SearchResult 搜索结果
type SearchResult struct {
	DocumentID      string
	KnowledgeBaseID string
	Content         string
	Score           float32
}
