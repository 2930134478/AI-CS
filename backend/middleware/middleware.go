package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func newTraceID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return strconv.FormatInt(time.Now().UnixNano(), 10)
	}
	return hex.EncodeToString(b[:])
}

// TraceID 为每个请求注入 trace_id，便于链路排障。
func TraceID() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := c.GetHeader("X-Trace-Id")
		if traceID == "" {
			traceID = newTraceID()
		}
		c.Set("trace_id", traceID)
		c.Writer.Header().Set("X-Trace-Id", traceID)
		c.Next()
	}
}

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		//继续调用后续的中间件处理函数
		c.Next()
		log.Printf("[GIN] %s %s %d %s",
			c.Request.Method, c.Request.URL.Path, c.Writer.Status(), time.Since(start))
	}
}

// StructuredHTTPLogger 将 HTTP 请求结构化落库（分类: http）。
func StructuredHTTPLogger(logSvc *service.SystemLogService) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		if logSvc == nil {
			return
		}
		latencyMs := time.Since(start).Milliseconds()
		status := c.Writer.Status()
		level := "info"
		if status >= 500 {
			level = "error"
		} else if status >= 400 || latencyMs >= 2000 {
			level = "warn"
		}
		if !logSvc.ShouldPersistLevel(level) {
			return
		}
		var userID *uint
		if v := c.GetHeader("X-User-Id"); v != "" {
			if id, err := strconv.ParseUint(v, 10, 64); err == nil && id > 0 {
				t := uint(id)
				userID = &t
			}
		}
		traceID := ""
		if v, ok := c.Get("trace_id"); ok {
			if s, ok2 := v.(string); ok2 {
				traceID = s
			}
		}
		_ = logSvc.Create(service.CreateSystemLogInput{
			Level:   level,
			Category: "http",
			Event:   "http_request",
			Source:  "backend",
			TraceID: traceID,
			UserID:  userID,
			Message: c.Request.Method + " " + c.Request.URL.Path,
			Meta: map[string]interface{}{
				"status":     status,
				"latency_ms": latencyMs,
				"path":       c.Request.URL.Path,
				"method":     c.Request.Method,
				"query":      c.Request.URL.RawQuery,
			},
		})
	}
}

func CORS() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-User-Id", "X-Trace-Id"},
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
