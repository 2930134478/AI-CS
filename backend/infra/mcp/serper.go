// Serper 通过 MCP 调用 Serper 搜索的 WebSearchProvider 实现。
// 需配合 Serper MCP 服务端（如 garylab/serper-mcp-server）使用，工具名一般为 google_search，参数为 query。

package mcp

import (
	"context"

	"github.com/2930134478/AI-CS/backend/infra/search"
)

// SerperWebSearchProvider 通过 MCP 调用 Serper 的 google_search 工具，实现 search.WebSearchProvider。
type SerperWebSearchProvider struct {
	client *Client
}

// NewSerperWebSearchProvider 创建基于 MCP 的 Serper 联网搜索提供方。client 需已 Connect。
func NewSerperWebSearchProvider(client *Client) search.WebSearchProvider {
	return &SerperWebSearchProvider{client: client}
}

// Search 执行搜索：调用 MCP 工具 google_search，将结果文本返回供 LLM 使用。
func (p *SerperWebSearchProvider) Search(ctx context.Context, query string) (string, error) {
	if p.client == nil {
		return "", nil
	}
	return p.client.CallTool(ctx, "google_search", map[string]any{"query": query})
}
