package controller

import (
	"net/http"
	"strings"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// EmailNotificationConfigController 离线邮件通知配置
type EmailNotificationConfigController struct {
	configSvc *service.EmailNotificationConfigService
	offline   *service.OfflineEmailService
	users     *service.UserService
}

// NewEmailNotificationConfigController 创建控制器
func NewEmailNotificationConfigController(
	configSvc *service.EmailNotificationConfigService,
	offline *service.OfflineEmailService,
	users *service.UserService,
) *EmailNotificationConfigController {
	return &EmailNotificationConfigController{
		configSvc: configSvc,
		offline:   offline,
		users:     users,
	}
}

// Get GET /agent/email-notification-config
func (e *EmailNotificationConfigController) Get(c *gin.Context) {
	if !requirePermission(c, e.users, string(service.PermSettings)) {
		return
	}
	if _, err := parseUintQuery(c, "user_id"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}
	result, err := e.configSvc.GetForAPI()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Update PUT /agent/email-notification-config
func (e *EmailNotificationConfigController) Update(c *gin.Context) {
	if !requirePermission(c, e.users, string(service.PermSettings)) {
		return
	}
	var req struct {
		UserID              uint    `json:"user_id" binding:"required"`
		Enabled             *bool   `json:"enabled"`
		SMTPHost            *string `json:"smtp_host"`
		SMTPPort            *int    `json:"smtp_port"`
		SMTPUser            *string `json:"smtp_user"`
		SMTPPassword        *string `json:"smtp_password"`
		FromEmail           *string `json:"from_email"`
		FromName            *string `json:"from_name"`
		OfflineDelaySeconds *int    `json:"offline_delay_seconds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}
	result, err := e.configSvc.Update(req.UserID, service.UpdateEmailNotificationConfigInput{
		Enabled:             req.Enabled,
		SMTPHost:            req.SMTPHost,
		SMTPPort:            req.SMTPPort,
		SMTPUser:            req.SMTPUser,
		SMTPPassword:        req.SMTPPassword,
		FromEmail:           req.FromEmail,
		FromName:            req.FromName,
		OfflineDelaySeconds: req.OfflineDelaySeconds,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Reset DELETE /agent/email-notification-config
func (e *EmailNotificationConfigController) Reset(c *gin.Context) {
	if !requirePermission(c, e.users, string(service.PermSettings)) {
		return
	}
	userID, err := parseUintQuery(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}
	result, err := e.configSvc.ResetToEnv(uint(userID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// SendTest POST /agent/email-notification-config/test
func (e *EmailNotificationConfigController) SendTest(c *gin.Context) {
	if !requirePermission(c, e.users, string(service.PermSettings)) {
		return
	}
	var req struct {
		UserID uint   `json:"user_id" binding:"required"`
		To     string `json:"to" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}
	userSummary, err := e.users.GetUser(req.UserID)
	if err != nil || userSummary == nil || userSummary.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "仅管理员可发送测试邮件"})
		return
	}
	to := strings.TrimSpace(req.To)
	if to == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "收件邮箱不能为空"})
		return
	}
	if err := e.offline.SendTestEmail(to); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "测试邮件已发送"})
}
