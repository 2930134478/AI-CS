package rag

import (
	"sync"
	"time"
)

// Metrics 性能指标
type Metrics struct {
	mu sync.RWMutex
	
	// 检索指标
	TotalQueries      int64
	SuccessfulQueries int64
	FailedQueries     int64
	
	// 缓存指标
	CacheHits   int64
	CacheMisses int64
	
	// 延迟指标
	TotalLatency time.Duration
	MinLatency   time.Duration
	MaxLatency   time.Duration
}

// NewMetrics 创建性能指标实例
func NewMetrics() *Metrics {
	return &Metrics{
		MinLatency: time.Hour, // 初始值设为很大
	}
}

// RecordQuery 记录查询
func (m *Metrics) RecordQuery(success bool, latency time.Duration, cacheHit bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.TotalQueries++
	if success {
		m.SuccessfulQueries++
	} else {
		m.FailedQueries++
	}

	if cacheHit {
		m.CacheHits++
	} else {
		m.CacheMisses++
	}

	m.TotalLatency += latency
	if latency < m.MinLatency {
		m.MinLatency = latency
	}
	if latency > m.MaxLatency {
		m.MaxLatency = latency
	}
}

// GetStats 获取统计信息
func (m *Metrics) GetStats() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	avgLatency := time.Duration(0)
	if m.TotalQueries > 0 {
		avgLatency = m.TotalLatency / time.Duration(m.TotalQueries)
	}

	successRate := float64(0)
	if m.TotalQueries > 0 {
		successRate = float64(m.SuccessfulQueries) / float64(m.TotalQueries) * 100
	}

	cacheHitRate := float64(0)
	totalCacheRequests := m.CacheHits + m.CacheMisses
	if totalCacheRequests > 0 {
		cacheHitRate = float64(m.CacheHits) / float64(totalCacheRequests) * 100
	}

	return map[string]interface{}{
		"total_queries":       m.TotalQueries,
		"successful_queries":  m.SuccessfulQueries,
		"failed_queries":      m.FailedQueries,
		"success_rate":       successRate,
		"cache_hits":          m.CacheHits,
		"cache_misses":        m.CacheMisses,
		"cache_hit_rate":      cacheHitRate,
		"average_latency_ms":   avgLatency.Milliseconds(),
		"min_latency_ms":      m.MinLatency.Milliseconds(),
		"max_latency_ms":      m.MaxLatency.Milliseconds(),
	}
}

// Reset 重置指标
func (m *Metrics) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.TotalQueries = 0
	m.SuccessfulQueries = 0
	m.FailedQueries = 0
	m.CacheHits = 0
	m.CacheMisses = 0
	m.TotalLatency = 0
	m.MinLatency = time.Hour
	m.MaxLatency = 0
}
