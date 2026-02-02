package rag

import (
	"context"
)

// Reranker 重排序器接口
type Reranker interface {
	Rerank(ctx context.Context, query string, results []SearchResult) ([]SearchResult, error)
}

// SimpleReranker 简单重排序器（按分数排序）
type SimpleReranker struct{}

// NewSimpleReranker 创建简单重排序器
func NewSimpleReranker() *SimpleReranker {
	return &SimpleReranker{}
}

// Rerank 重排序结果（当前实现仅按分数排序，预留扩展接口）
func (r *SimpleReranker) Rerank(ctx context.Context, query string, results []SearchResult) ([]SearchResult, error) {
	// 当前实现：按分数降序排序（分数越高越好）
	// 注意：Milvus 使用 IP 或 L2 距离，分数越小表示相似度越高
	// 这里假设已经转换为相似度分数（越大越好）
	// 实际使用时，可能需要根据 metric type 调整排序逻辑
	
	// 简单实现：保持原有顺序（Milvus 已经按相似度排序）
	return results, nil
}
