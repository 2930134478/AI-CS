package rag

import (
	"fmt"
	"sync"
	"time"
)

// Cache 检索结果缓存
type Cache struct {
	mu    sync.RWMutex
	data  map[string]*cacheEntry
	ttl   time.Duration
}

type cacheEntry struct {
	results   []SearchResult
	expiresAt time.Time
}

// NewCache 创建缓存实例
func NewCache() *Cache {
	return &Cache{
		data: make(map[string]*cacheEntry),
		ttl:  0, // 默认不缓存
	}
}

// SetTTL 设置缓存过期时间
func (c *Cache) SetTTL(ttl int) {
	c.ttl = time.Duration(ttl) * time.Second
}

// Get 获取缓存结果
func (c *Cache) Get(query string, topK int, knowledgeBaseID *uint) ([]SearchResult, bool) {
	if c.ttl == 0 {
		return nil, false
	}

	c.mu.RLock()
	defer c.mu.RUnlock()

	key := c.buildKey(query, topK, knowledgeBaseID)
	entry, ok := c.data[key]
	if !ok {
		return nil, false
	}

	// 检查是否过期
	if time.Now().After(entry.expiresAt) {
		delete(c.data, key)
		return nil, false
	}

	return entry.results, true
}

// Set 设置缓存结果
func (c *Cache) Set(query string, topK int, knowledgeBaseID *uint, results []SearchResult) {
	if c.ttl == 0 {
		return
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	key := c.buildKey(query, topK, knowledgeBaseID)
	c.data[key] = &cacheEntry{
		results:   results,
		expiresAt: time.Now().Add(c.ttl),
	}
}

// buildKey 构建缓存键
func (c *Cache) buildKey(query string, topK int, knowledgeBaseID *uint) string {
	key := fmt.Sprintf("%s|%d", query, topK)
	if knowledgeBaseID != nil {
		key += fmt.Sprintf("|%d", *knowledgeBaseID)
	}
	return key
}
