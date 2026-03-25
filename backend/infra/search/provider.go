// Package search 提供联网搜索等能力的抽象与实现，便于后续扩展（爬虫、生成文档等）。
// 当前仅实现 Serper 联网搜索；新增能力时在此包增加 Provider 接口与具体实现即可。
package search

import "context"

// WebSearchProvider 联网搜索能力抽象。Serper 实现此接口；后续可增加其他实现或新能力（如 CrawlProvider）。
type WebSearchProvider interface {
	Search(ctx context.Context, query string) (string, error)
}
