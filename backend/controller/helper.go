package controller

import (
	"strconv"
	"time"

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
