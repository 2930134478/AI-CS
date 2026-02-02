package rag

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/service/embedding"
)

// RetrievalService RAG 检索服务
type RetrievalService struct {
	vectorStoreService *VectorStoreService
	embeddingProvider  embedding.EmbeddingProvider
	docRepo            *repository.DocumentRepository   // 按发布状态过滤
	kbRepo             *repository.KnowledgeBaseRepository // 按知识库「参与 RAG」过滤
	cache              *Cache
	reranker           *SimpleReranker
	metrics            *Metrics
}

// NewRetrievalService 创建 RAG 检索服务实例（仅已发布文档且所属知识库已开启 RAG 的参与检索）
func NewRetrievalService(vectorStoreService *VectorStoreService, embeddingProvider embedding.EmbeddingProvider, docRepo *repository.DocumentRepository, kbRepo *repository.KnowledgeBaseRepository) *RetrievalService {
	return &RetrievalService{
		vectorStoreService: vectorStoreService,
		embeddingProvider:  embeddingProvider,
		docRepo:            docRepo,
		kbRepo:             kbRepo,
		cache:              NewCache(),
		reranker:           NewSimpleReranker(),
		metrics:            NewMetrics(),
	}
}

// EnableCache 启用检索缓存（ttl 单位为秒）
func (s *RetrievalService) EnableCache(ttl time.Duration) {
	s.cache.SetTTL(int(ttl.Seconds()))
}

// Retrieve 执行 RAG 检索
func (s *RetrievalService) Retrieve(ctx context.Context, query string, topK int, knowledgeBaseID *uint) ([]SearchResult, error) {
	startTime := time.Now()
	cacheHit := false
	var results []SearchResult
	var err error

	// 检查缓存
	if s.cache != nil {
		if cached, ok := s.cache.Get(query, topK, knowledgeBaseID); ok {
			results = cached
			cacheHit = true
		}
	}

	// 如果缓存未命中，执行检索
	if !cacheHit {
		svc, err := s.embeddingProvider.Get(ctx)
		if err != nil {
			s.metrics.RecordQuery(false, time.Since(startTime), false)
			return nil, fmt.Errorf("获取嵌入服务失败: %w", err)
		}
		// 向量化查询
		queryVectors, err := svc.EmbedTexts(ctx, []string{query})
		if err != nil {
			s.metrics.RecordQuery(false, time.Since(startTime), false)
			return nil, fmt.Errorf("查询向量化失败: %w", err)
		}
		if len(queryVectors) == 0 {
			s.metrics.RecordQuery(false, time.Since(startTime), false)
			return nil, fmt.Errorf("未返回查询向量")
		}

		// 转换知识库 ID
		var kbIDStr *string
		if knowledgeBaseID != nil {
			str := ConvertKnowledgeBaseID(*knowledgeBaseID)
			kbIDStr = &str
		}

		// 多取一些结果，过滤未发布文档后仍能凑满 topK
		searchLimit := topK * 3
		if searchLimit < 10 {
			searchLimit = 10
		}
		results, err = s.vectorStoreService.SearchVectors(ctx, queryVectors[0], searchLimit, kbIDStr)
		if err != nil {
			s.metrics.RecordQuery(false, time.Since(startTime), false)
			return nil, fmt.Errorf("向量检索失败: %w", err)
		}

		// 仅保留「已发布」的文档参与 RAG；未在 documents 表中的条目（如 FAQ）视为可展示
		results = s.filterByPublished(ctx, results, topK)

		// 缓存过滤后的结果
		if s.cache != nil {
			s.cache.Set(query, topK, knowledgeBaseID, results)
		}
	}

	// 记录指标
	s.metrics.RecordQuery(err == nil, time.Since(startTime), cacheHit)

	return results, err
}

// RetrieveWithRerank 执行带重排序的 RAG 检索
func (s *RetrievalService) RetrieveWithRerank(ctx context.Context, query string, topK int, knowledgeBaseID *uint) ([]SearchResult, error) {
	// 先执行基础检索
	results, err := s.Retrieve(ctx, query, topK, knowledgeBaseID)
	if err != nil {
		return nil, err
	}

	// 重排序
	if s.reranker != nil {
		reranked, err := s.reranker.Rerank(ctx, query, results)
		if err != nil {
			// 重排序失败不影响主流程，返回原始结果
			return results, nil
		}
		return reranked, nil
	}

	return results, nil
}

// filterByPublished 仅保留「已发布」且所属知识库已开启 RAG 的文档；FAQ 保留；取前 topK 条
func (s *RetrievalService) filterByPublished(ctx context.Context, results []SearchResult, topK int) []SearchResult {
	if s.docRepo == nil || len(results) == 0 {
		if len(results) > topK {
			return results[:topK]
		}
		return results
	}
	docIDs := make([]uint, 0, len(results))
	seen := make(map[uint]struct{})
	for _, r := range results {
		id, err := strconv.ParseUint(r.DocumentID, 10, 32)
		if err != nil {
			continue
		}
		uid := uint(id)
		if _, ok := seen[uid]; !ok {
			seen[uid] = struct{}{}
			docIDs = append(docIDs, uid)
		}
	}
	docs, err := s.docRepo.GetByIDs(docIDs)
	if err != nil {
		return results
	}
	unpublished := make(map[uint]struct{})
	docIDToKBID := make(map[uint]uint)
	for _, d := range docs {
		if d.Status != "published" {
			unpublished[d.ID] = struct{}{}
		}
		docIDToKBID[d.ID] = d.KnowledgeBaseID
	}
	// 知识库未参与 RAG 的集合
	disabledKBIDs := make(map[uint]struct{})
	if s.kbRepo != nil && len(docIDToKBID) > 0 {
		kbIDSet := make(map[uint]struct{})
		for _, kbID := range docIDToKBID {
			kbIDSet[kbID] = struct{}{}
		}
		kbIDs := make([]uint, 0, len(kbIDSet))
		for id := range kbIDSet {
			kbIDs = append(kbIDs, id)
		}
		if kbs, err := s.kbRepo.GetByIDs(kbIDs); err == nil {
			for _, kb := range kbs {
				if !kb.RAGEnabled {
					disabledKBIDs[kb.ID] = struct{}{}
				}
			}
		}
	}
	filtered := make([]SearchResult, 0, len(results))
	for _, r := range results {
		id, err := strconv.ParseUint(r.DocumentID, 10, 32)
		if err != nil {
			filtered = append(filtered, r)
			continue
		}
		uid := uint(id)
		if _, ok := unpublished[uid]; ok {
			continue
		}
		if kbID, inDoc := docIDToKBID[uid]; inDoc {
			if _, disabled := disabledKBIDs[kbID]; disabled {
				continue
			}
		}
		filtered = append(filtered, r)
		if len(filtered) >= topK {
			break
		}
	}
	return filtered
}

// GetMetrics 获取性能指标
func (s *RetrievalService) GetMetrics() map[string]interface{} {
	return s.metrics.GetStats()
}
