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
