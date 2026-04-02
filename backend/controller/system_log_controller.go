package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

type SystemLogController struct {
	logs        *service.SystemLogService
	users       *service.UserService
	appSettings *repository.AppSettingRepository
}

func NewSystemLogController(logs *service.SystemLogService, users *service.UserService, appSettings *repository.AppSettingRepository) *SystemLogController {
	return &SystemLogController{logs: logs, users: users, appSettings: appSettings}
}

// GetLogs 查询日志（客服端）。
func (lc *SystemLogController) GetLogs(c *gin.Context) {
	if !requirePermission(c, lc.users, string(service.PermLogs)) {
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

// GetLogMinLevel 返回当前生效的落库级别、环境变量默认值、是否由数据库覆盖。
func (lc *SystemLogController) GetLogMinLevel(c *gin.Context) {
	if !requirePermission(c, lc.users, string(service.PermLogs)) {
		return
	}
	envRank := service.SystemLogMinPersistLevelFromEnv()
	effective := lc.logs.MinPersistLevelRank()
	var persisted bool
	if lc.appSettings != nil {
		if row, err := lc.appSettings.Get(models.AppSettingKeySystemLogMinLevel); err == nil && row != nil && strings.TrimSpace(row.Value) != "" {
			persisted = true
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"effective_min_level":   service.SystemLogMinLevelLabel(effective),
		"env_min_level":         service.SystemLogMinLevelLabel(envRank),
		"persisted_in_database": persisted,
	})
}

type putLogMinLevelBody struct {
	MinLevel string `json:"min_level"`
}

// PutLogMinLevel 将最低落库级别写入数据库并立即生效（覆盖 .env，直至删除该配置）。
func (lc *SystemLogController) PutLogMinLevel(c *gin.Context) {
	if !requirePermission(c, lc.users, string(service.PermLogs)) {
		return
	}
	if lc.appSettings == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "配置存储不可用"})
		return
	}
	var body putLogMinLevelBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求体无效"})
		return
	}
	rank, err := service.ParseSystemLogMinPersistLevelStrict(body.MinLevel)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	label := service.SystemLogMinLevelLabel(rank)
	if err := lc.appSettings.SetValue(models.AppSettingKeySystemLogMinLevel, label); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存配置失败"})
		return
	}
	lc.logs.SetMinPersistLevelRank(rank)
	c.JSON(http.StatusOK, gin.H{
		"ok":                  true,
		"effective_min_level": label,
	})
}

// DeleteLogMinLevel 删除数据库中的覆盖项，恢复为环境变量 SYSTEM_LOG_MIN_LEVEL。
func (lc *SystemLogController) DeleteLogMinLevel(c *gin.Context) {
	if !requirePermission(c, lc.users, string(service.PermLogs)) {
		return
	}
	if lc.appSettings == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "配置存储不可用"})
		return
	}
	if err := lc.appSettings.Delete(models.AppSettingKeySystemLogMinLevel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除配置失败"})
		return
	}
	envRank := service.SystemLogMinPersistLevelFromEnv()
	lc.logs.SetMinPersistLevelRank(envRank)
	c.JSON(http.StatusOK, gin.H{
		"ok":                  true,
		"effective_min_level": service.SystemLogMinLevelLabel(envRank),
	})
}

