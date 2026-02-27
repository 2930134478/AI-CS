package middleware

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		//继续调用后续的中间件处理函数
		c.Next()
		log.Printf("[GIN] %s %s %d %s",
			c.Request.Method, c.Request.URL.Path, c.Writer.Status(), time.Since(start))
	}
}

func CORS() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: false,
	})
}

// RequireAuth 认证中间件：要求请求头中包含有效的 X-User-Id
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetHeader("X-User-Id")
		if userIDStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问，请提供 X-User-Id 请求头"})
			c.Abort()
			return
		}

		userID, err := strconv.ParseUint(userIDStr, 10, 64)
		if err != nil || userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户ID不合法"})
			c.Abort()
			return
		}

		// 将用户ID存储到上下文中，供后续使用
		c.Set("user_id", uint(userID))
		c.Next()
	}
}
