package controller

import (
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/middleware"
	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

// getUserIDFromHeader 返回经登录令牌校验的客服用户 ID（不可伪造 X-User-Id）。
func getUserIDFromHeader(c *gin.Context) uint {
	return middleware.GetAuthenticatedUserID(c)
}

// requireSelfUserID 校验路径中的 user_id 与当前登录用户一致。
func requireSelfUserID(c *gin.Context, pathUserID uint) bool {
	authID := getUserIDFromHeader(c)
	if authID == 0 {
		c.JSON(403, gin.H{"error": "未授权访问，请登录"})
		return false
	}
	if authID != pathUserID {
		c.JSON(403, gin.H{"error": "无权访问其他用户的资料"})
		return false
	}
	return true
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

// requirePermission 统一的权限校验（基于登录令牌解析出的 user_id）。
func requirePermission(c *gin.Context, userSvc *service.UserService, perm string) bool {
	if userSvc == nil {
		c.JSON(500, gin.H{"error": "权限服务未初始化"})
		return false
	}
	userID := getUserIDFromHeader(c)
	if userID == 0 {
		c.JSON(401, gin.H{"error": "未授权访问，请登录"})
		return false
	}
	if err := userSvc.CheckPermission(userID, perm); err != nil {
		c.JSON(403, gin.H{"error": err.Error()})
		return false
	}
	return true
}

const conversationAccessTokenHeader = "X-Conversation-Token"

// getConversationAccessToken 从 Header 或 Query 读取访客会话令牌。
func getConversationAccessToken(c *gin.Context) string {
	if token := strings.TrimSpace(c.GetHeader(conversationAccessTokenHeader)); token != "" {
		return token
	}
	return strings.TrimSpace(c.Query("access_token"))
}

// authorizeConversationAccess 校验对会话的访问权限（客服或持 token 的访客）。
// 失败时已写入 HTTP 响应；成功返回会话详情。
func authorizeConversationAccess(
	c *gin.Context,
	convSvc *service.ConversationService,
	userSvc *service.UserService,
	conversationID uint,
) (*service.ConversationDetail, bool) {
	userID := getUserIDFromHeader(c)
	accessToken := getConversationAccessToken(c)

	detail, err := convSvc.GetConversationDetail(conversationID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(404, gin.H{"error": "会话不存在"})
		} else {
			c.JSON(500, gin.H{"error": "查询失败"})
		}
		return nil, false
	}

	if detail.ConversationType == "internal" {
		if userID == 0 || detail.AgentID != userID {
			c.JSON(403, gin.H{"error": "无权限访问内部会话"})
			return nil, false
		}
		if userSvc != nil {
			if err := userSvc.CheckPermission(userID, string(service.PermKBTest)); err != nil {
				c.JSON(403, gin.H{"error": err.Error()})
				return nil, false
			}
		}
		return detail, true
	}

	if userID > 0 {
		if userSvc != nil {
			if err := userSvc.CheckPermission(userID, string(service.PermChat)); err != nil {
				c.JSON(403, gin.H{"error": err.Error()})
				return nil, false
			}
		}
		return detail, true
	}

	if err := convSvc.ValidateVisitorAccessToken(conversationID, accessToken); err != nil {
		if errors.Is(err, service.ErrConversationNotFound) {
			c.JSON(404, gin.H{"error": "会话不存在"})
		} else {
			c.JSON(403, gin.H{"error": "无权限访问该会话"})
		}
		return nil, false
	}
	return detail, true
}
