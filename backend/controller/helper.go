package controller

import (
	"strconv"
	"time"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

const timeFormat = "2006-01-02T15:04:05Z07:00"

// parseUintParam 将路径参数转换为 uint64。
func parseUintParam(c *gin.Context, name string) (uint64, error) {
	value := c.Param(name)
	return strconv.ParseUint(value, 10, 64)
}

// parseUintQuery 将查询参数转换为 uint64。
func parseUintQuery(c *gin.Context, name string) (uint64, error) {
	value := c.Query(name)
	if value == "" {
		return 0, strconv.ErrSyntax
	}
	return strconv.ParseUint(value, 10, 64)
}

// getUserIDFromHeader 从请求头 X-User-Id 读取当前用户 ID（用于知识库开关校验）
// 若未设置则返回 0（调用方可按需放行或拒绝）
func getUserIDFromHeader(c *gin.Context) uint {
	value := c.GetHeader("X-User-Id")
	if value == "" {
		return 0
	}
	id, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0
	}
	return uint(id)
}

// formatTimeValue 按统一格式输出时间字符串。
func formatTimeValue(t time.Time) string {
	return t.Format(timeFormat)
}

// formatTimePointer 在指针为空时返回空字符串。
func formatTimePointer(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format(timeFormat)
}

// getTraceID 从请求上下文读取 trace_id（由中间件注入）。
func getTraceID(c *gin.Context) string {
	if v, ok := c.Get("trace_id"); ok {
		if s, ok2 := v.(string); ok2 {
			return s
		}
	}
	return ""
}

// requirePermission 统一的权限校验（基于 X-User-Id）。
// 返回 true 表示允许继续；false 表示已输出错误响应。
func requirePermission(c *gin.Context, userSvc *service.UserService, perm string) bool {
	if userSvc == nil {
		c.JSON(500, gin.H{"error": "权限服务未初始化"})
		return false
	}
	userID := getUserIDFromHeader(c)
	if err := userSvc.CheckPermission(userID, perm); err != nil {
		// 未授权/无权限统一 403（避免泄露过多信息）
		c.JSON(403, gin.H{"error": err.Error()})
		return false
	}
	return true
}
