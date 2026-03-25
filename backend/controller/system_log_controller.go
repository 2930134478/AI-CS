package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

type SystemLogController struct {
	logs *service.SystemLogService
}

func NewSystemLogController(logs *service.SystemLogService) *SystemLogController {
	return &SystemLogController{logs: logs}
}

// GetLogs 查询日志（客服端）。
func (lc *SystemLogController) GetLogs(c *gin.Context) {
	userID := getUserIDFromHeader(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权，请提供 X-User-Id"})
		return
	}
	var convID *uint
	if v := strings.TrimSpace(c.Query("conversation_id")); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err == nil {
			t := uint(id)
			convID = &t
		}
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	res, err := lc.logs.Query(service.QuerySystemLogsInput{
		From:           c.Query("from"),
		To:             c.Query("to"),
		Level:          c.Query("level"),
		Category:       c.Query("category"),
		Event:          c.Query("event"),
		Source:         c.Query("source"),
		ConversationID: convID,
		Keyword:        c.Query("keyword"),
		Page:           page,
		PageSize:       pageSize,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询日志失败"})
		return
	}
	c.JSON(http.StatusOK, res)
}

type reportFrontendLogRequest struct {
	Level          string                 `json:"level"`
	Category       string                 `json:"category"`
	Event          string                 `json:"event"`
	TraceID        string                 `json:"trace_id"`
	ConversationID *uint                  `json:"conversation_id"`
	VisitorID      *uint                  `json:"visitor_id"`
	Message        string                 `json:"message"`
	Meta           map[string]interface{} `json:"meta"`
}

// ReportFrontendLog 前端上报日志（用于捕获页面异常与关键请求失败）。
func (lc *SystemLogController) ReportFrontendLog(c *gin.Context) {
	var req reportFrontendLogRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	userID := getUserIDFromHeader(c)
	var pUserID *uint
	if userID > 0 {
		pUserID = &userID
	}
	// 基础防护：限制 message/meta 体量，避免日志接口被刷爆。
	if len(req.Message) > 2000 {
		req.Message = req.Message[:2000]
	}
	traceID := strings.TrimSpace(req.TraceID)
	if traceID == "" {
		traceID = getTraceID(c)
	}
	if req.Meta != nil {
		req.Meta["truncated"] = false
	}
	if err := lc.logs.Create(service.CreateSystemLogInput{
		Level:          req.Level,
		Category:       req.Category,
		Event:          req.Event,
		Source:         "frontend",
		TraceID:        traceID,
		ConversationID: req.ConversationID,
		UserID:         pUserID,
		VisitorID:      req.VisitorID,
		Message:        req.Message,
		Meta:           req.Meta,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "写入日志失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

