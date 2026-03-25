// Package mcp 提供 MCP（Model Context Protocol）客户端，用于通过 MCP 协议调用远程工具（如 Serper 搜索）。
package mcp

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// ErrNotConfigured 表示未配置 MCP 服务 URL 或未成功连接。
var ErrNotConfigured = errors.New("mcp: server URL not configured or not connected")

// Client 封装对单个 MCP 服务端的连接，支持 CallTool。
type Client struct {
	serverURL string
	impl      *mcp.Implementation
	transport *mcp.StreamableClientTransport
	client    *mcp.Client
	session   *mcp.ClientSession
	mu        sync.Mutex
}

// NewClient 创建一个 MCP 客户端。serverURL 为 MCP 服务 HTTP/SSE 地址（如 http://localhost:3000/sse）。
// 若 serverURL 为空，后续 Connect/CallTool 将返回 ErrNotConfigured。
func NewClient(serverURL string) *Client {
	url := strings.TrimSpace(serverURL)
	return &Client{
		serverURL: url,
		impl:      &mcp.Implementation{Name: "ai-cs-backend", Version: "v1.0.0"},
	}
}

// Connect 连接到 MCP 服务端。应在调用 CallTool 前成功调用一次。
func (c *Client) Connect(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.serverURL == "" {
		return ErrNotConfigured
	}
	if c.session != nil {
		return nil // 已连接
	}
	c.transport = &mcp.StreamableClientTransport{Endpoint: c.serverURL}
	c.client = mcp.NewClient(c.impl, nil)
	session, err := c.client.Connect(ctx, c.transport, nil)
	if err != nil {
		return fmt.Errorf("mcp connect: %w", err)
	}
	c.session = session
	return nil
}

// CallTool 调用远程工具。name 为工具名（如 google_search），args 为参数（如 map[string]any{"query": "..."}）。
// 返回工具结果中的文本内容拼接；若未连接或工具返回错误则返回错误。
func (c *Client) CallTool(ctx context.Context, name string, args map[string]any) (string, error) {
	c.mu.Lock()
	session := c.session
	c.mu.Unlock()
	if c.serverURL == "" {
		return "", ErrNotConfigured
	}
	if session == nil {
		return "", ErrNotConfigured
	}
	params := &mcp.CallToolParams{Name: name, Arguments: args}
	result, err := session.CallTool(ctx, params)
	if err != nil {
		return "", fmt.Errorf("mcp call tool %s: %w", name, err)
	}
	if result.IsError {
		// 工具侧错误，从 Content 中取错误信息
		text := extractTextContent(result.Content)
		if text != "" {
			return "", fmt.Errorf("mcp tool error: %s", text)
		}
		return "", fmt.Errorf("mcp tool error (no content)")
	}
	return extractTextContent(result.Content), nil
}

// Close 关闭与 MCP 服务端的会话。
func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.session == nil {
		return nil
	}
	err := c.session.Close()
	c.session = nil
	return err
}

func extractTextContent(content []mcp.Content) string {
	var b strings.Builder
	for _, c := range content {
		if tc, ok := c.(*mcp.TextContent); ok {
			b.WriteString(tc.Text)
		}
	}
	return b.String()
}
