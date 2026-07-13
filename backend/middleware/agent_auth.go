package middleware

import (
	"net/http"
	"strings"

	"github.com/2930134478/AI-CS/backend/utils"
	"github.com/gin-gonic/gin"
)

const authenticatedUserIDKey = "authenticated_user_id"

// AgentAuth 要求有效的客服登录令牌（login 返回的 ws_token，Bearer 或 X-Agent-Token）。
// 不再信任可伪造的 X-User-Id 请求头。
func AgentAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractAgentToken(c)
		userID, ok := utils.ParseAgentToken(token)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问，请登录"})
			c.Abort()
			return
		}
		c.Set(authenticatedUserIDKey, userID)
		c.Next()
	}
}

func extractAgentToken(c *gin.Context) string {
	auth := strings.TrimSpace(c.GetHeader("Authorization"))
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return strings.TrimSpace(auth[7:])
	}
	if t := strings.TrimSpace(c.GetHeader("X-Agent-Token")); t != "" {
		return t
	}
	return strings.TrimSpace(c.Query("ws_token"))
}

// GetAuthenticatedUserID 从上下文读取经 AgentAuth 校验的用户 ID。
func GetAuthenticatedUserID(c *gin.Context) uint {
	if v, ok := c.Get(authenticatedUserIDKey); ok {
		if uid, ok2 := v.(uint); ok2 && uid > 0 {
			return uid
		}
	}
	token := extractAgentToken(c)
	if uid, ok := utils.ParseAgentToken(token); ok {
		return uid
	}
	return 0
}
