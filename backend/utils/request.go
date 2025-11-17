package utils

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// GetClientIP 获取客户端 IP 地址（考虑代理情况）
func GetClientIP(c *gin.Context) string {
	// 优先从 X-Forwarded-For 获取（适用于代理/负载均衡）
	ip := strings.TrimSpace(c.GetHeader("X-Forwarded-For"))
	if ip != "" {
		return ip
	}
	// 从 X-Real-IP 获取
	ip = strings.TrimSpace(c.GetHeader("X-Real-IP"))
	if ip != "" {
		return ip
	}
	return c.ClientIP()
}

// ParseUserAgent 从 User-Agent 字符串中解析浏览器和操作系统
func ParseUserAgent(userAgent string) (browser string, os string) {
	browser = "Unknown"
	os = "Unknown"

	ua := strings.ToLower(userAgent)
	if ua == "" {
		return
	}

	switch {
	case strings.Contains(ua, "edg/"):
		browser = "Edge"
	case strings.Contains(ua, "chrome/"):
		browser = "Chrome"
	case strings.Contains(ua, "firefox/"):
		browser = "Firefox"
	case strings.Contains(ua, "safari/"):
		browser = "Safari"
	}

	switch {
	case strings.Contains(ua, "windows nt"):
		os = "Windows"
	case strings.Contains(ua, "mac os x") || strings.Contains(ua, "macintosh"):
		os = "macOS"
	case strings.Contains(ua, "android"):
		os = "Android"
	case strings.Contains(ua, "iphone") || strings.Contains(ua, "ipad"):
		os = "iOS"
	case strings.Contains(ua, "linux"):
		os = "Linux"
	}

	return
}
