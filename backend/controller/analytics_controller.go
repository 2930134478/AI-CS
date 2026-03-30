package controller

import (
	"net/http"
	"time"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// AnalyticsController 数据分析报表（客服端查询 + 访客端埋点）
type AnalyticsController struct {
	analytics *service.AnalyticsService
	users     *service.UserService
}

func NewAnalyticsController(analytics *service.AnalyticsService, users *service.UserService) *AnalyticsController {
	return &AnalyticsController{analytics: analytics, users: users}
}

// GetSummary GET /agent/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
func (ac *AnalyticsController) GetSummary(c *gin.Context) {
	if !requirePermission(c, ac.users, string(service.PermAnalytics)) {
		return
	}
	from := c.Query("from")
	to := c.Query("to")
	if from == "" || to == "" {
		// 默认最近 7 天（含今天）
		loc, _ := time.LoadLocation("Asia/Shanghai")
		now := time.Now().In(loc)
		to = now.Format("2006-01-02")
		from = now.AddDate(0, 0, -6).Format("2006-01-02")
	}
	res, err := ac.analytics.GetSummary(from, to)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

type widgetOpenRequest struct {
	VisitorID uint `json:"visitor_id"`
}

// PostWidgetOpen POST /visitor/analytics/widget-open — 访客打开小窗时上报（无需登录）
func (ac *AnalyticsController) PostWidgetOpen(c *gin.Context) {
	var req widgetOpenRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.VisitorID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供有效的 visitor_id"})
		return
	}
	if err := ac.analytics.RecordWidgetOpen(req.VisitorID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
